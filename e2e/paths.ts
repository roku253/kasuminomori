/** baseURL（…/kasuminomori/）配下への相対パス。先頭 `/` は使わない */
export function sitePath(path = ""): string {
  return path.replace(/^\//, "");
}
