const rawBasePath = (import.meta.env.BASE_URL ?? "/").trim();
const sanitizedBasePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/+$/, "");
const normalizedBasePath = sanitizedBasePath.startsWith("/") ? sanitizedBasePath : `/${sanitizedBasePath}`;
const basePath = normalizedBasePath === "/" ? "" : normalizedBasePath;
const configuredSiteOrigin = (
  import.meta.env.VITE_PUBLIC_SITE_ORIGIN ?? import.meta.env.VITE_PUBLIC_SITE_URL ?? "",
)
  .trim()
  .replace(/\/+$/, "");

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
  const candidate = explicitOrigin?.trim() || configuredSiteOrigin;

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

function getBasePathWithLeadingSlash(): string {
  const normalizedBase = basePath || "/";

  return ensureLeadingSlash(normalizedBase).replace(/\/{2,}/g, "/");
}

type BuildEventsPathOptions = {
  eventId?: string | null;
  query?: string | null;
};

function isEventsPathOptions(value: unknown): value is BuildEventsPathOptions {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildEventsPath(eventId?: string | null): string;
export function buildEventsPath(options?: BuildEventsPathOptions | null): string;
export function buildEventsPath(
  eventIdOrOptions?: string | null | BuildEventsPathOptions,
): string {
  const normalizedBase = getBasePathWithLeadingSlash();
  const params = new URLSearchParams();

  params.set("section", "events");

  let eventId: string | null | undefined;
  let requestedQuery: string | null | undefined;

  if (isEventsPathOptions(eventIdOrOptions)) {
    eventId = eventIdOrOptions.eventId;
    requestedQuery = eventIdOrOptions.query;
  } else {
    eventId = eventIdOrOptions;
  }

  const trimmedId = eventId?.toString().trim();

  if (trimmedId) {
    params.set("event", trimmedId);
  }

  const trimmedQuery = requestedQuery?.toString().trim();

  if (trimmedQuery) {
    params.set("query", trimmedQuery);
  }

  const queryString = params.toString();

  return queryString ? `${normalizedBase}?${queryString}` : normalizedBase;
}

export function getSiteOrigin(): string | undefined {
  return resolveOrigin();
}

export function buildAbsoluteUrl(pathOrUrl?: string | null): string | undefined {
  const candidate = pathOrUrl?.toString().trim();

  if (!candidate) {
    return undefined;
  }

  try {
    if (/^[a-z]+:\/\//i.test(candidate)) {
      return new URL(candidate).toString();
    }

    const origin = getSiteOrigin();

    if (origin) {
      return new URL(candidate, origin).toString();
    }

    if (typeof window !== "undefined" && window.location?.origin) {
      return new URL(candidate, window.location.origin).toString();
    }
  } catch {
    return candidate;
  }

  return candidate;
}

export function buildEventsUrl(
  eventId?: string | null,
  origin?: string,
): string;
export function buildEventsUrl(
  options?: BuildEventsPathOptions | null,
  origin?: string,
): string;
export function buildEventsUrl(
  eventIdOrOptions?: string | null | BuildEventsPathOptions,
  origin?: string,
): string {
  const path = buildEventsPath(
    isEventsPathOptions(eventIdOrOptions) ? eventIdOrOptions : eventIdOrOptions ?? undefined,
  );
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
