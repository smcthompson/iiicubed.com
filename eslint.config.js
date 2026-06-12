const tsParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./', './**', '../', '../**'],
              message: 'Use @/... aliases instead of relative imports.',
            },
          ],
        },
      ],
    },
  },
];
