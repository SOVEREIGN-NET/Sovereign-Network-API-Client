import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom environment for localStorage support
    // Browser APIs like localStorage and fetch are needed for tests
    environment: 'jsdom',

    // Match test files
    include: ['src/**/*.test.ts'],

    // Coverage settings
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/index.ts',
        'src/**/*.d.ts',
      ],
    },

    // Globals - no need to import describe/it/expect
    globals: true,

    // Setup files if needed later
    setupFiles: [],
  },
});
