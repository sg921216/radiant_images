import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
export default ts.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.venv/**',
      '**/__pycache__/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.react-router/**',
      '**/.wrangler/**',
      '**/*.min.js',
      'test-results/**',
      'playwright-report/**',
      '.specify/**',
      '.agents/**',
      '.github/skills/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': hooks },
    rules: { ...hooks.configs.recommended.rules },
  },
);
