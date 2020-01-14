module.exports = {
  root: true,
  env: {
    node: true,
  },
  'extends': [
    'plugin:vue/essential',
    '@vue/standard',
    '@vue/typescript',
  ],
  rules: {
    // TODO production時はdrop_consoleする
    // 'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-multi-spaces': ['error', { ignoreEOLComments: true }],
    'brace-style': ['error', 'stroustrup'],
    'comma-dangle': ['error', 'always-multiline'],
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
}
