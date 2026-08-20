import type { Page, Request, Response } from '@playwright/test';

export type ApiCallRecord = {
  method: string;
  url: string;
  status: number;
  aborted: boolean;
  errorText?: string;
};

/** Coleta chamadas /api/v1 ignorando abortos (React Strict Mode / navegação). */
export function attachApiCollector(page: Page) {
  const calls: ApiCallRecord[] = [];

  page.on('requestfinished', async (request: Request) => {
    const url = request.url();
    if (!url.includes('/api/v1')) return;
    const response = await request.response();
    const failure = request.failure();
    calls.push({
      method: request.method(),
      url,
      status: response?.status() ?? 0,
      aborted: !!failure,
      errorText: failure?.errorText,
    });
  });

  page.on('requestfailed', (request: Request) => {
    const url = request.url();
    if (!url.includes('/api/v1')) return;
    const err = request.failure()?.errorText ?? '';
    if (err.includes('NS_BINDING_ABORTED') || err.includes('net::ERR_ABORTED')) {
      calls.push({
        method: request.method(),
        url,
        status: 0,
        aborted: true,
        errorText: err,
      });
    }
  });

  return {
    getCalls: () => calls,
    getBlockingFailures: (pathFragment?: string) =>
      calls.filter((c) => {
        if (c.aborted) return false;
        if (pathFragment && !c.url.includes(pathFragment)) return false;
        return c.status >= 400;
      }),
    reset: () => {
      calls.length = 0;
    },
  };
}

export async function saveHarOnFailure(
  page: Page,
  testInfo: { outputPath: (name: string) => string },
) {
  // Playwright trace já cobre falhas; helper reservado para extensão HAR manual.
  void page;
  void testInfo;
}
