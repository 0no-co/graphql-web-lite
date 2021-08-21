import * as path from 'path';

import resolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

const cwd = process.cwd();
const externalModules = ['dns', 'fs', 'path', 'url'];
const externalPredicate = new RegExp(`^(${externalModules.join('|')})($|/)`);

const config = {
  input: {
    graphql: './alias/index.mjs',
  },
  external(id) {
    return externalPredicate.test(id);
  },
  treeshake: {
    unknownGlobalSideEffects: false,
    tryCatchDeoptimization: false,
    moduleSideEffects: false,
  },
};

export default {
  ...config,
  shimMissingExports: true,
  plugins: [
    {
      async resolveId(source, importer) {
        if (source.startsWith('.') && importer) {
          source = path.resolve(path.dirname(importer), source);
        }

        const base = path.join(cwd, 'node_modules/graphql/');
        const baseSource = path.relative(base, source);
        if (baseSource.startsWith('..')) {
          return null;
        }

        const aliasSource = path.join(cwd, 'alias/', baseSource);
        return this.resolve(aliasSource, importer, { skipSelf: true });
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
        'babel-plugin-modular-graphql',
        'reghex/babel',
      ],
    }),
  ],

  output: [
    {
      chunkFileNames: '[hash].mjs',
      entryFileNames: '[name].mjs',
      dir: './dist',
      exports: 'named',
      externalLiveBindings: false,
      sourcemap: true,
      esModule: false,
      indent: false,
      freeze: false,
      strict: false,
      format: 'esm',
    },
    {
      chunkFileNames: '[hash].min.mjs',
      entryFileNames: '[name].min.mjs',
      dir: './dist',
      exports: 'named',
      externalLiveBindings: false,
      sourcemap: true,
      esModule: false,
      indent: false,
      freeze: false,
      strict: false,
      format: 'esm',
      plugins: [
        terser({
          warnings: true,
          ecma: 5,
          ie8: false,
          toplevel: true,
          compress: {
            keep_infinity: true,
            pure_getters: true,
            passes: 10
          },
          mangle: {
            module: true,
          },
          output: {
            comments: false
          }
        }),
      ],
    }
  ],
};
