module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
};