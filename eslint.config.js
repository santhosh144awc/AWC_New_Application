import js from '@eslint/js';

export default [
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/**', 'test-results/**'],
  },
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
];
