/**
 * UUIDs estáveis do backend. Duque/Tijuca permanecem no mapa só para
 * localStorage/API antiga; não entram mais no seletor (migration 000034).
 */
export const UNIDADE_API_IDS: Record<string, string> = {
  'unidade-duque-caxias': 'a0000000-0000-4000-8000-000000000001',
  'unidade-tijuca': 'a0000000-0000-4000-8000-000000000002',
  'unidade-catanduva': 'a0000000-0000-4000-8000-000000000003',
  'unidade-londrina': 'a0000000-0000-4000-8000-000000000004',
  'unidade-sertanopolis': 'a0000000-0000-4000-8000-000000000005',
  'unidade-online': 'a0000000-0000-4000-8000-000000000006',
};

export function getUnidadeSlugFromApiId(uuid: string): string | null {
  for (const [slug, id] of Object.entries(UNIDADE_API_IDS)) {
    if (id === uuid) return slug;
  }
  return null;
}

export function getUnidadeApiId(slugOrId: string): string | null {
  if (UNIDADE_API_IDS[slugOrId]) {
    return UNIDADE_API_IDS[slugOrId];
  }
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRe.test(slugOrId)) return slugOrId;
  return null;
}

/** Slug/id do frontend → UUID da API (undefined-safe). */
export function resolveUnidadeApiId(unidadeSlugOrId: string | undefined): string | null {
  if (!unidadeSlugOrId) return null;
  return getUnidadeApiId(unidadeSlugOrId);
}

/** Prefer UUID from API (`apiId`); fallback to hardcoded slug map. */
export function resolveUnidadeApiIdFromContext(
  slugId: string,
  apiId?: string | null,
): string | null {
  if (apiId) return apiId;
  return getUnidadeApiId(slugId);
}

export function buildUnidadeIdsPayload(
  activeSlug: string,
  extraSlugs: string[] = []
): { unidade_id: string; principal: boolean }[] {
  const principalId = getUnidadeApiId(activeSlug);
  if (!principalId) {
    throw new Error(`Unidade sem mapeamento API: ${activeSlug}`);
  }
  const links: { unidade_id: string; principal: boolean }[] = [
    { unidade_id: principalId, principal: true },
  ];
  for (const slug of extraSlugs) {
    const id = getUnidadeApiId(slug);
    if (id && id !== principalId) {
      links.push({ unidade_id: id, principal: false });
    }
  }
  return links;
}
