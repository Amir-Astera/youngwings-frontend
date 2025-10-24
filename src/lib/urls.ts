const rawBasePath = (import.meta.env.BASE_URL ?? "/").trim();
const sanitizedBasePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/+$/, "");
const normalizedBasePath = sanitizedBasePath.startsWith("/") ? sanitizedBasePath : `/${sanitizedBasePath}`;
const basePath = normalizedBasePath === "/" ? "" : normalizedBasePath;
const publicSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");

function ensureLeadingSlash(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}

export function getBasePath(): string {
  return basePath || "/";
}

export function buildPostPath(postId: string): string {
  const trimmedId = postId.trim();
  const encodedId = encodeURIComponent(trimmedId);
  const prefix = basePath ? `${basePath}/post/${encodedId}` : `/post/${encodedId}`;

  return ensureLeadingSlash(prefix).replace(/\/{2,}/g, "/");
}

function resolveOrigin(explicitOrigin?: string): string | undefined {
  const candidate = explicitOrigin?.trim() || publicSiteUrl;

  if (candidate) {
    return candidate.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return undefined;
}

export function buildPostUrl(postId: string, origin?: string): string {
  const path = buildPostPath(postId);
  const resolvedOrigin = resolveOrigin(origin);

  if (resolvedOrigin) {
    return `${resolvedOrigin}${path}`;
  }

  return path;
}

interface LocationLike {
  pathname: string;
  search: string;
  hash: string;
}

function extractPostIdFromPath(pathname: string): string | null {
  let normalized = pathname || "/";

  if (basePath) {
    if (!normalized.startsWith(basePath)) {
      return null;
    }

    normalized = normalized.slice(basePath.length) || "/";
  }

  normalized = ensureLeadingSlash(normalized);
  const match = normalized.match(/^\/post\/([^/?#]+)/i);

  if (!match || !match[1]) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(match[1]);
    return decoded.trim() || null;
  } catch {
    return match[1].trim() || null;
  }
}

export function extractPostIdFromLocation(location: LocationLike): string | null {
  const fromPath = extractPostIdFromPath(location.pathname);

  if (fromPath) {
    return fromPath;
  }

  const params = new URLSearchParams(location.search || "");
  const candidate = params.get("post") ?? params.get("postId");
  const trimmed = candidate?.trim();

  return trimmed || null;
}
