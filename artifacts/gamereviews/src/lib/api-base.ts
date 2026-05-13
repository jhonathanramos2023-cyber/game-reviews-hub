/**
 * Resolves the full URL for API requests.
 *
 * Important: the backend is always mounted at `/api` on the **site origin** (Vite dev proxy,
 * typical reverse-proxy setups). Do **not** prefix `import.meta.env.BASE_URL` here — if the SPA
 * is served under a subpath (e.g. `/app/`), prefixing would produce `/app/api/...`, which misses the
 * dev proxy and fails on first load until something triggers a different fetch pattern.
 *
 * Optional `VITE_API_ORIGIN` (e.g. http://127.0.0.1:3001) forces an absolute origin for CORS/direct calls.
 */
export function resolveApiUrl(apiPath: string): string {
  const pathPart = apiPath.startsWith("/api")
    ? apiPath
    : `/api${apiPath.startsWith("/") ? apiPath : `/${apiPath}`}`;

  const origin = import.meta.env.VITE_API_ORIGIN as string | undefined;
  if (origin?.trim()) {
    return `${origin.replace(/\/+$/, "")}${pathPart}`;
  }

  return pathPart;
}
