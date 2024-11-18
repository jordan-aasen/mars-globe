import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default [
  // Global rules for all file types
  {
    files: ['**/*.{js,jsx,ts,tsx}'], // All JavaScript and TypeScript files
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...prettier.rules, // Ensure compatibility with Prettier
      'no-console': 'error', // Enforce no console logs
    },
  },

  // JavaScript-specific rules
  {
    files: ['**/*.{js,jsx}'], // JavaScript and JSX files
    plugins: {
      react,
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Disable for React 17+ JSX transform
      'react/prop-types': 'off', // Optional: Disable prop-types checking if using TypeScript
      'no-unused-vars': 'warn',
    },
  },

  // TypeScript-specific rules
  {
    files: ['**/*.{ts,tsx}'], // TypeScript and TSX files
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off', // Optional: Customize TypeScript rules
    },
  },
];
