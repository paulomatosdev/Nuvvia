"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, tokenStore } from "./api";

type Estado<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Busca dados da API no cliente. Em 401 (token ausente/expirado),
 * limpa a sessão e manda para o login.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): Estado<T> {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [versao, setVersao] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((res) => {
        if (!cancelado) setData(res);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear();
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Erro inesperado");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versao, router, ...deps]);

  const reload = useCallback(() => setVersao((v) => v + 1), []);
  return { data, error, loading, reload };
}
