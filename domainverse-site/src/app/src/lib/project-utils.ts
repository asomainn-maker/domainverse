export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "layihe";
}

export function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

const CONTENT_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "application/javascript; charset=utf-8",
  json: "application/json; charset=utf-8",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  txt: "text/plain; charset=utf-8",
  pdf: "application/pdf",
};

export function contentTypeFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export function stripCommonRoot(paths: string[]): (p: string) => string {
  const segments = paths
    .filter((p) => p.includes("/"))
    .map((p) => p.split("/")[0]);
  const allSame =
    segments.length === paths.length &&
    segments.length > 0 &&
    segments.every((s) => s === segments[0]);

  if (!allSame) return (p) => p;
  const prefix = segments[0] + "/";
  return (p) => (p.startsWith(prefix) ? p.slice(prefix.length) : p);
}
