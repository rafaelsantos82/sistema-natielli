import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/** Credenciais E2E: process.env > backend/.env > .env.local > defaults do seed-admin. */
function applyEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

applyEnvFile(path.join(rootDir, 'backend', '.env'));
applyEnvFile(path.join(rootDir, '.env.local'));

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const apiURL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080/api/v1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: process.env.PW_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        // Reutiliza `npm run dev` se a porta 5173 estiver ocupada; auth E2E usa API (não depende do Vite bootstrap).
        reuseExistingServer: process.env.PW_REUSE_DEV_SERVER !== 'false',
        timeout: 120_000,
        env: {
          ...process.env,
          VITE_AUTH_BOOTSTRAP: 'true',
          VITE_E2E: 'true',
          BOOTSTRAP_AUTH_TOKEN: process.env.BOOTSTRAP_AUTH_TOKEN ?? 'change-bootstrap-token',
        },
      },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'api',
      testMatch: /swagger\.spec\.ts|unidades-network\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'crud',
      testMatch: /crud-flow\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'agenda-sync',
      testMatch: /agenda-sync\.spec\.ts/,
      dependencies: ['setup'],
    },
    {
      name: 'manual-usuario',
      testMatch: /manual-usuario-screenshots\.spec\.ts/,
    },
  ],
  metadata: { apiURL },
});
