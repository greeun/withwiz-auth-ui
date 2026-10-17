import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    // 계약 테스트용 toolkit(devDependency)은 `next/server` 를 확장자 없이 import 한다. Node ESM 은 이를
    // 해석하지 못하므로(next 에 exports 맵이 없음) Vite 가 직접 변환·해석하게 한다.
    server: { deps: { inline: [/@withwiz\/toolkit/] } },
  },
});
