import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node22',
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'lambda/schema-get': resolve(__dirname, 'src/lambda/schema-get.ts'),
        'lambda/schema-list': resolve(__dirname, 'src/lambda/schema-list.ts'),
        'lambda/schema-create': resolve(__dirname, 'src/lambda/schema-create.ts'),
        'lambda/schema-update': resolve(__dirname, 'src/lambda/schema-update.ts'),
        'lambda/schema-disable': resolve(__dirname, 'src/lambda/schema-disable.ts'),
        'lambda/schema-activate': resolve(__dirname, 'src/lambda/schema-activate.ts'),
        'lambda/config-get': resolve(__dirname, 'src/lambda/config-get.ts'),
        'lambda/config-list': resolve(__dirname, 'src/lambda/config-list.ts'),
        'lambda/config-create': resolve(__dirname, 'src/lambda/config-create.ts'),
        'lambda/config-update': resolve(__dirname, 'src/lambda/config-update.ts'),
        'lambda/config-disable': resolve(__dirname, 'src/lambda/config-disable.ts'),
        'lambda/config-activate': resolve(__dirname, 'src/lambda/config-activate.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^@aws-sdk\//, 'express', 'prom-client', 'uuid', 'ajv'],
    },
  },
});
