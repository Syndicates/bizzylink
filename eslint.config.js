module.exports = {
  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    globals: {
      window: 'readonly',
      document: 'readonly',
      navigator: 'readonly',
      process: 'readonly',
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  plugins: {
    react: require('eslint-plugin-react'),
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}; 