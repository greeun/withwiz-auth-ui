import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/components/index.ts',
    'src/hooks/index.ts',
    'src/i18n/index.ts',
    'src/pages/index.ts',
  ],
  format: ['esm'],
  dts: false,
  clean: true,
  external: ['react', 'react-dom', 'next', 'zod'],
  sourcemap: true,
  treeshake: true,
});
