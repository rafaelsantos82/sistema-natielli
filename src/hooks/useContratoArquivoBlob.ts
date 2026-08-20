import { useCallback, useEffect, useState } from 'react';

export function isPdfMime(mime?: string): boolean {
  if (!mime) return false;
  const m = mime.toLowerCase();
  return m === 'application/pdf' || m.endsWith('/pdf');
}

export function useContratoArquivoBlob(
  fetchBlob: (() => Promise<Blob>) | undefined,
  enabled: boolean,
  mimeHint?: string,
) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !fetchBlob) {
      setBlob(null);
      setBlobUrl(null);
      setPdfBytes(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const b = await fetchBlob();
        if (cancelled) return;
        setBlob(b);
        objectUrl = URL.createObjectURL(b);
        setBlobUrl(objectUrl);
        const mime = b.type || mimeHint;
        if (isPdfMime(mime)) {
          const buf = await b.arrayBuffer();
          if (!cancelled) setPdfBytes(new Uint8Array(buf));
        } else {
          setPdfBytes(null);
        }
      } catch {
        if (!cancelled) setError('Não foi possível carregar o documento.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBlobUrl(null);
      setPdfBytes(null);
    };
  }, [enabled, fetchBlob, mimeHint]);

  const download = useCallback(
    (filename: string) => {
      if (!blob) return;
      const url = blobUrl ?? URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (!blobUrl) URL.revokeObjectURL(url);
    },
    [blob, blobUrl],
  );

  const effectiveMime = blob?.type || mimeHint;
  const isPdf = isPdfMime(effectiveMime);

  return { blob, blobUrl, pdfBytes, loading, error, isPdf, download };
}
