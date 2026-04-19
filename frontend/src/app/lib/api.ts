/** In dev, Vite proxies /api to the backend. Set VITE_API_URL when the frontend is hosted separately. */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';
  return base ? `${base}${path}` : path;
}
