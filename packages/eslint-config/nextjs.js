module.exports = {
  extends: [
    './base.js',
    'next/core-web-vitals',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};