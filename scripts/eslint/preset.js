module.exports = {
  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
    },
  },
  extends: ['plugin:prettier/recommended'],
  ignorePatterns: ['node_modules/', 'dist-*/', 'dist/'],
  plugins: ['prettier'],
  rules: {
    'sort-keys': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'prefer-arrow/prefer-arrow-functions': 'off',

    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
      },
    ],
  },
};
