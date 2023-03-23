import * as path from 'path';
import { promises as fs } from 'fs';

import resolve from '@rollup/plugin-node-resolve';
import buble from '@rollup/plugin-buble';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { babel } from '@rollup/plugin-babel';

import babelModularGraphQL from 'babel-plugin-modular-graphql';
import babelTransformComputedProps from '../babel/transformComputedProps.mjs';
import babelTransformDevAssert from '../babel/transformDevAssert.mjs';
import babelTransformObjectFreeze from '../babel/transformObjectFreeze.mjs';

import { packageMetadata, version } from './packageMetadata.mjs';
import { generateImportMap } from './importMap.mjs';

const cwd = process.cwd();
const graphqlModule = path.posix.join(cwd, 'node_modules/graphql/');
const virtualModule = path.posix.join(cwd, 'virtual/');
const aliasModule = path.posix.join(cwd, 'alias/');

const EXTERNAL = 'graphql';
const externalModules = ['dns', 'fs', 'path', 'url'];
const externalPredicate = new RegExp(`^(${externalModules.join('|')})($|/)`);

function manualChunks(id, utils) {
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
  return importers.length === 1 ? manualChunks(importers[0], utils) : 'shared';
}

function buildPlugin() {
  const exports = {};
  return {
    async buildStart(options) {
      const importMap = await generateImportMap();

      for (const key in importMap) {
        const { from, local } = importMap[key];
        if (/\/jsutils\//g.test(from)) continue;

        const name = from.replace(/^graphql\//, '');
        exports[name] = (exports[name] || '') + `export { ${key} } from '${EXTERNAL}'\n`;

        const parts = name.split('/');
        for (let i = parts.length - 1; i > 0; i--) {
          const name = `${parts.slice(0, i).join('/')}/index`;
          const from = `./${parts.slice(i).join('/')}`;
          if (from !== './index')
            exports[name] = (exports[name] || '') + `export { ${local} } from '${from}'\n`;
        }

        const index = `export { ${local} } from './${name}'\n`;
        exports.index = (exports.index || '') + index;
      }

      if (typeof options.input !== 'object') options.input = {};

      for (const key in exports) {
        options.input[key] = path.posix.join('./virtual', key);
      }
    },

    async load(id) {
      if (!id.startsWith(virtualModule)) return null;
      const entry = path.posix.relative(virtualModule, id).replace(/\.m?js$/, '');
      if (entry === 'version') return version;
      return exports[entry] || null;
    },

    async resolveId(source, importer) {
      if (!source.startsWith('.') && !source.startsWith('virtual/')) return null;

      const target = path.posix.join(importer ? path.posix.dirname(importer) : cwd, source);

      const virtualEntry = path.posix.relative(virtualModule, target);
      if (!virtualEntry.startsWith('../')) {
        const aliasSource = path.posix.join(aliasModule, virtualEntry);
        const alias = await this.resolve(aliasSource, undefined, {
          skipSelf: true,
        });
        return alias || target;
      }

      const graphqlEntry = path.posix.relative(graphqlModule, target);
      if (!graphqlEntry.startsWith('../')) {
        const aliasSource = path.posix.join(aliasModule, graphqlEntry);
        const alias = await this.resolve(aliasSource, undefined, {
          skipSelf: true,
        });
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

      this.emitFile({
        type: 'asset',
        fileName: 'README.md',
        source: await fs.readFile('README.md'),
      });

      this.emitFile({
        type: 'asset',
        fileName: 'LICENSE',
        source: await fs.readFile('./LICENSE.md'),
      });
    },

    async renderChunk(_code, { fileName }) {
      const name = fileName.replace(/\.m?js$/, '');

      const getContents = async extension => {
        try {
          const name = fileName.replace(/\.m?js$/, '');
          const contents = await fs.readFile(path.join(graphqlModule, name + extension));
          return contents;
        } catch (_error) {
          return null;
        }
      };

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
  };
}

export default {
  input: {},
  external(id) {
    return externalPredicate.test(id);
  },
  treeshake: {
    unknownGlobalSideEffects: false,
    tryCatchDeoptimization: false,
    moduleSideEffects: false,
  },
  plugins: [
    buildPlugin(),

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
        babelTransformComputedProps,
        babelModularGraphQL,
      ],
    }),

    replace({
      preventAssignment: true,
      values: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    }),

    terser({
      warnings: true,
      ecma: 2016,
      keep_fnames: true,
      compress: {
        module: true,
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
        join_vars: false,
      },
      mangle: false,
      output: {
        beautify: true,
        braces: true,
        indent_level: 2,
      },
    }),
  ],

  treeshake: 'smallest',
  shimMissingExports: false,
  preserveEntrySignatures: 'allow-extension',
  preserveSymlinks: true,

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
