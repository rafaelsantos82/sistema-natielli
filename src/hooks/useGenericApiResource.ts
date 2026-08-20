import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createResource,
  deleteResource,
  listResource,
  updateResource,
} from '@/lib/api/genericCrud';

type PersistLocal<T> = {
  read: () => T[];
  write: (items: T[]) => void;
};

export function useGenericApiResource<T extends { id: string }>(opts: {
  queryKey: string;
  path: string;
  apiEnabled: boolean;
  listParams?: Record<string, string | number | undefined>;
  local: PersistLocal<T>;
  mapFromApi?: (item: T) => T;
  mapToCreate?: (item: Omit<T, 'id'>) => unknown;
  mapToUpdate?: (item: T) => unknown;
}) {
  const queryClient = useQueryClient();
  const [localItems, setLocalItems] = useState<T[]>(() => opts.local.read());

  useEffect(() => {
    if (!opts.apiEnabled) {
      setLocalItems(opts.local.read());
    }
  }, [opts.apiEnabled]);

  const { data: apiItems = [], isLoading, isError, error } = useQuery({
    queryKey: [opts.queryKey, opts.listParams],
    enabled: opts.apiEnabled,
    queryFn: async () => {
      const { items } = await listResource<T>(opts.path, {
        page_size: 500,
        ...opts.listParams,
      });
      return items.map((i) => (opts.mapFromApi ? opts.mapFromApi(i) : i));
    },
  });

  const items = opts.apiEnabled ? apiItems : localItems;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [opts.queryKey] });

  const persistLocal = (next: T[]) => {
    opts.local.write(next);
    setLocalItems(next);
  };

  const create = useCallback(
    async (data: Omit<T, 'id'>): Promise<T> => {
      if (opts.apiEnabled) {
        const id = await createResource(opts.path, opts.mapToCreate ? opts.mapToCreate(data as T) : data);
        await invalidate();
        return { ...data, id } as T;
      }
      const novo = { ...data, id: crypto.randomUUID() } as T;
      persistLocal([...localItems, novo]);
      return novo;
    },
    [opts.apiEnabled, localItems],
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      if (opts.apiEnabled) {
        const current = items.find((i) => i.id === id);
        if (!current) return;
        const body = opts.mapToUpdate
          ? opts.mapToUpdate({ ...current, ...patch } as T)
          : { ...current, ...patch };
        await updateResource(opts.path, id, body);
        await invalidate();
        return;
      }
      persistLocal(
        localItems.map((i) => (i.id === id ? ({ ...i, ...patch } as T) : i)),
      );
    },
    [opts.apiEnabled, items, localItems],
  );

  const remove = useCallback(
    async (id: string) => {
      if (opts.apiEnabled) {
        await deleteResource(opts.path, id);
        await invalidate();
        return;
      }
      persistLocal(localItems.filter((i) => i.id !== id));
    },
    [opts.apiEnabled, localItems],
  );

  return {
    items,
    isLoading: opts.apiEnabled ? isLoading : false,
    isError: opts.apiEnabled ? isError : false,
    error: opts.apiEnabled ? error : null,
    create,
    update,
    remove,
    invalidate,
  };
}
