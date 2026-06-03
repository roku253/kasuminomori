export const BASE_PATH = "/kasuminomori";

export function assetPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${p}`;
}

export function sitePath(path: string): string {
  if (!path || path === "/") return `${BASE_PATH}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  const normalized = p.endsWith("/") ? p : `${p}/`;
  return `${BASE_PATH}${normalized}`;
}
