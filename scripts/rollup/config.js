import * as path from 'path';
import { promises as fs } from 'fs';

import resolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

import babelModularGraphQL from 'babel-plugin-modular-graphql';
import babelTransformDevAssert from '../babel/transformDevAssert.mjs';
import babelTransformObjectFreeze from '../babel/transformObjectFreeze.mjs';

import packageMetadata from './packageMetadata';

const cwd = process.cwd();
const graphqlModule = path.join(cwd, 'node_modules/graphql/');
const virtualModule = path.join(cwd, 'virtual/');
const aliasModule = path.join(cwd, 'alias/');

const EXTERNAL = 'graphql';
const externalModules = ['dns', 'fs', 'path', 'url'];
const externalPredicate = new RegExp(`^(${externalModules.join('|')})($|/)`);

const exports = {};
const importMap = require('babel-plugin-modular-graphql/import-map.json');
const excludeMap = new Set(['Lexer']);

for (const key in importMap) {
  const { from, local } = importMap[key];
  if (/\/jsutils\//g.test(from) || excludeMap.has(key)) continue;

  const name = from.replace(/^graphql\//, '');
  exports[name] = (exports[name] || '') + `export { ${key} } from '${EXTERNAL}'\n`;

  const parts = name.split('/');
  for (let i = parts.length - 1; i > 0; i--) {
    const name = `${parts.slice(0, i).join('/')}/index`;
    const from = `./${parts.slice(i).join('/')}`;
    exports[name] = (exports[name] || '') + `export { ${local} } from '${from}'\n`;
  }

  const index = `export { ${local} } from './${name}'\n`;
  exports.index = (exports.index || '') + index;
}

const manualChunks = (id, utils) => {
  let chunk;
  if (id.startsWith(graphqlModule)) {
    chunk = id.slice(graphqlModule.length);
  } else if (id.startsWith(virtualModule)) {
    chunk = id.slice(virtualModule.length);
  } else if (id.startsWith(aliasModule)) {
    chunk = id.slice(aliasModule.length);
  }

  if (chunk) {
    return chunk.replace(/\.m?js$/, '');
  }

  const { importers } = utils.getModuleInfo(id);
  return importers.length === 1
    ? manualChunks(importers[0], utils)
    : 'shared';
};

export default {
  input:
    Object.keys(exports).reduce((input, key) => {
      input[key] = path.join('./virtual', key);
      return input;
    }, {}),
  external(id) {
    return externalPredicate.test(id);
  },
  treeshake: {
    unknownGlobalSideEffects: false,
    tryCatchDeoptimization: false,
    moduleSideEffects: false,
  },
  plugins: [
    {
      async load(id) {
        if (!id.startsWith(virtualModule))
          return null;

        const entry = path.relative(virtualModule, id).replace(/\.m?js$/, '');
        return exports[entry] || null;
      },

      async resolveId(source, importer) {
        if (!source.startsWith('.') && !source.startsWith('virtual/'))
          return null;

        const target = path.join(importer ? path.dirname(importer) : cwd, source);

        const virtualEntry = path.relative(virtualModule, target);
        if (!virtualEntry.startsWith('../')) {
          const aliasSource = path.join(aliasModule, virtualEntry);
          const alias = await this.resolve(aliasSource, undefined, { skipSelf: true });
          return alias || target;
        }

        const graphqlEntry = path.relative(graphqlModule, target);
        if (!graphqlEntry.startsWith('../')) {
          const aliasSource = path.join(aliasModule, graphqlEntry);
          const alias = await this.resolve(aliasSource, undefined, { skipSelf: true });
          return alias || target;
        }

        return null;
      },

      async renderStart() {
        this.emitFile({
          type: 'asset',
          fileName: 'package.json',
          source: packageMetadata,
        });
      },

      async renderChunk(_code, { fileName }) {
        const name = fileName.replace(/\.m?js$/, '');

        const getContents = async (extension) => {
          try {
            const name = fileName.replace(/\.m?js$/, '');
            const contents = await fs.readFile(path.join(graphqlModule, name + extension));
            return contents;
          } catch (_error) {
            return null;
          }
        }

        const dts = await getContents('.d.ts');
        const flow = await getContents('.js.flow');

        if (dts) {
          this.emitFile({
            type: 'asset',
            fileName: name + '.d.ts',
            source: dts,
          });
        }

        if (flow) {
          this.emitFile({
            type: 'asset',
            fileName: name + '.js.flow',
            source: flow,
          });
        }

        return null;
      },
    },

    resolve({
      extensions: ['.mjs', '.js'],
      mainFields: ['module', 'browser', 'main'],
      preferBuiltins: false,
      browser: true,
    }),

    babel({
      babelrc: false,
      babelHelpers: 'bundled',
      presets: [],
      plugins: [
        babelTransformDevAssert,
        babelTransformObjectFreeze,
        babelModularGraphQL,
        'reghex/babel',
      ],
    }),

    terser({
      warnings: true,
      ecma: 5,
      keep_fnames: true,
      ie8: false,
      compress: {
        pure_getters: true,
        toplevel: true,
        booleans_as_integers: false,
        keep_fnames: true,
        keep_fargs: true,
        if_return: false,
        ie8: false,
        sequences: false,
        loops: false,
        conditionals: false,
        join_vars: false
      },
      mangle: {
        module: true,
        keep_fnames: true,
      },
      output: {
        beautify: true,
        braces: true,
        indent_level: 2
      }
    }),
  ],

  treeshake: 'smallest',
  shimMissingExports: false,
  preserveEntrySignatures: 'allow-extension',

  output: [
    {
      chunkFileNames: '[name].js',
      entryFileNames: '[name].js',
      dir: './dist',
      exports: 'named',
      format: 'cjs',
      minifyInternalExports: false,
      hoistTransitiveImports: false,
      manualChunks,
    },
    {
      chunkFileNames: '[name].mjs',
      entryFileNames: '[name].mjs',
      dir: './dist',
      exports: 'named',
      format: 'esm',
      minifyInternalExports: false,
      hoistTransitiveImports: false,
      manualChunks,
    },
  ],
};
