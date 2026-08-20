import { describe, it, expect } from 'vitest';
import { buildPaginationItems } from './ListPagination';

describe('buildPaginationItems', () => {
  it('lista todas as páginas quando há poucas', () => {
    expect(buildPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('insere reticências em listas longas', () => {
    expect(buildPaginationItems(1, 14)).toEqual([1, 2, 'ellipsis', 14]);
    expect(buildPaginationItems(7, 14)).toEqual([1, 'ellipsis', 6, 7, 8, 'ellipsis', 14]);
    expect(buildPaginationItems(14, 14)).toEqual([1, 'ellipsis', 13, 14]);
  });
});
