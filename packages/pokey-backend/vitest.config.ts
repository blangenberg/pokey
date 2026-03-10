import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['src/__tests__/functional/**', 'node_modules/**'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
