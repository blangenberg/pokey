import { defineConfig } from 'vitest/config';
import { execSync } from 'node:child_process';

function getPodmanSocket(): string | undefined {
  try {
    const output = execSync('podman machine inspect', { encoding: 'utf-8' });
    const parsed = JSON.parse(output) as Array<{ ConnectionInfo?: { PodmanSocket?: { Path?: string } } }>;
    return parsed[0]?.ConnectionInfo?.PodmanSocket?.Path;
  } catch {
    return undefined;
  }
}

const podmanSocket = getPodmanSocket();
if (podmanSocket && !process.env['DOCKER_HOST']) {
  process.env['DOCKER_HOST'] = `unix://${podmanSocket}`;
}
process.env['TESTCONTAINERS_RYUK_DISABLED'] = 'true';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/functional/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
