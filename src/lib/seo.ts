import defaultOgImageUrl from "../assets/news-placeholder.svg";
import { getBasePath } from "./urls";

export const SITE_NAME = "OrientVentus";
export const SITE_TAGLINE = "Медиа о бизнесе, стартапах и инновациях в Китае";
export const SITE_DESCRIPTION =
  "OrientVentus — независимая медиа-платформа, которая рассказывает о бизнесе, стартапах и инновациях в Китае для русскоязычной аудитории.";

const DEFAULT_KEYWORDS = [
  "OrientVentus",
  "YoungWinds",
  "Китай",
  "бизнес в Китае",
  "стартапы",
  "инновации",
  "аналитика",
  "технологии",
  "рынок Китая",
  "предпринимательство",
];

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string[] | string;
  image?: string | null;
  imageAlt?: string;
  url?: string;
  canonical?: string;
  type?: string;
  robots?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  author?: string;
}

const DEFAULT_SEO_BASE: Required<Pick<SeoMetadata, "title" | "description" | "keywords" | "type" | "image" | "imageAlt" | "robots">> &
  Pick<SeoMetadata, "author"> = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  type: "website",
  image: defaultOgImageUrl,
  imageAlt: `${SITE_NAME} — ${SITE_TAGLINE}`,
  robots: "index, follow",
  author: undefined,
};

function sanitizeText(value?: string | null): string {
  return (value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength = 200): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}

function ensureMetaByName(name: string): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    element.setAttribute("data-managed-seo", "true");
    document.head.appendChild(element);
  }

  return element;
}

function ensureMetaByProperty(property: string): HTMLMetaElement {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    element.setAttribute("data-managed-seo", "true");
    document.head.appendChild(element);
  }

  return element;
}

function setMetaContent(element: HTMLMetaElement, value?: string | null): void {
  if (!element) {
    return;
  }

  if (value && value.trim()) {
    element.setAttribute("content", value.trim());
  } else {
    element.setAttribute("content", "");
  }
}

function updateCanonicalLink(href?: string): void {
  const existing = document.head.querySelector<HTMLLinkElement>("link[rel=\"canonical\"]");

  if (href && href.trim()) {
    const normalized = href.trim();

    if (existing) {
      existing.setAttribute("href", normalized);
      existing.setAttribute("data-managed-seo", "true");
      return;
    }

    const link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", normalized);
    link.setAttribute("data-managed-seo", "true");
    document.head.appendChild(link);
    return;
  }

  if (existing?.dataset.managedSeo === "true") {
    existing.remove();
  }
}

function toAbsoluteUrl(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    if (typeof window !== "undefined") {
      return new URL(url, window.location.origin + getBasePath()).toString();
    }

    return new URL(url, "https://example.com").toString();
  } catch {
    return url ?? undefined;
  }
}

function normaliseKeywords(keywords?: string[] | string): string[] {
  if (!keywords) {
    return [...DEFAULT_KEYWORDS];
  }

  const list = Array.isArray(keywords)
    ? keywords
    : keywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const seen = new Set<string>();
  const merged: string[] = [];

  for (const value of [...DEFAULT_KEYWORDS, ...list]) {
    const lower = value.toLowerCase();

    if (!seen.has(lower)) {
      seen.add(lower);
      merged.push(value);
    }
  }

  return merged;
}

function formatIsoDate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function clearManagedMeta(selector: string): void {
  document.head
    .querySelectorAll<HTMLMetaElement>(selector)
    .forEach((element) => {
      if (element.dataset.managedSeo === "true") {
        element.remove();
      }
    });
}

export function updateSeoMetadata(overrides: SeoMetadata = {}): SeoMetadata {
  const base: SeoMetadata = { ...DEFAULT_SEO_BASE };
  const merged: SeoMetadata = {
    ...base,
    ...overrides,
  };

  merged.title = sanitizeText(merged.title || base.title);
  merged.description = truncate(sanitizeText(merged.description || base.description));
  merged.imageAlt = sanitizeText(merged.imageAlt || merged.title || base.imageAlt);
  merged.keywords = normaliseKeywords(merged.keywords);
  merged.type = merged.type || base.type;
  merged.robots = sanitizeText(merged.robots || base.robots);
  merged.publishedTime = formatIsoDate(merged.publishedTime);
  merged.modifiedTime = formatIsoDate(merged.modifiedTime);

  if (typeof window !== "undefined") {
    merged.url = overrides.url || window.location.href;
    merged.canonical = overrides.canonical || merged.url;
  } else {
    merged.url = overrides.url;
    merged.canonical = overrides.canonical || overrides.url;
  }

  merged.image = toAbsoluteUrl(merged.image ?? base.image);

  if (typeof document === "undefined") {
    return merged;
  }

  if (merged.title) {
    document.title = merged.title;
  }

  setMetaContent(ensureMetaByName("description"), merged.description);
  setMetaContent(ensureMetaByName("keywords"), (merged.keywords as string[]).join(", "));
  setMetaContent(ensureMetaByName("robots"), merged.robots);

  if (merged.author) {
    setMetaContent(ensureMetaByName("author"), merged.author);
  } else {
    const authorMeta = document.head.querySelector<HTMLMetaElement>('meta[name="author"][data-managed-seo="true"]');
    authorMeta?.remove();
  }

  setMetaContent(ensureMetaByProperty("og:title"), merged.title);
  setMetaContent(ensureMetaByProperty("og:description"), merged.description);
  setMetaContent(ensureMetaByProperty("og:type"), merged.type);
  setMetaContent(ensureMetaByProperty("og:url"), merged.url);
  setMetaContent(ensureMetaByProperty("og:site_name"), SITE_NAME);
  setMetaContent(ensureMetaByProperty("og:locale"), "ru_RU");
  setMetaContent(ensureMetaByProperty("og:image"), merged.image);
  setMetaContent(ensureMetaByProperty("og:image:alt"), merged.imageAlt);

  setMetaContent(ensureMetaByName("twitter:card"), merged.image ? "summary_large_image" : "summary");
  setMetaContent(ensureMetaByName("twitter:title"), merged.title);
  setMetaContent(ensureMetaByName("twitter:description"), merged.description);
  setMetaContent(ensureMetaByName("twitter:url"), merged.url);
  setMetaContent(ensureMetaByName("twitter:image"), merged.image);
  setMetaContent(ensureMetaByName("twitter:image:alt"), merged.imageAlt);
  setMetaContent(ensureMetaByName("twitter:site"), `@${SITE_NAME}`);

  if (merged.type === "article") {
    setMetaContent(ensureMetaByProperty("article:published_time"), merged.publishedTime);
    setMetaContent(ensureMetaByProperty("article:modified_time"), merged.modifiedTime);
    setMetaContent(ensureMetaByProperty("article:section"), merged.section ?? "");

    clearManagedMeta('meta[property="article:tag"][data-managed-seo="true"]');

    if (Array.isArray(merged.tags)) {
      for (const tag of merged.tags) {
        const cleaned = sanitizeText(tag);

        if (!cleaned) {
          continue;
        }

        const meta = document.createElement("meta");
        meta.setAttribute("property", "article:tag");
        meta.setAttribute("content", cleaned);
        meta.setAttribute("data-managed-seo", "true");
        document.head.appendChild(meta);
      }
    }

    if (merged.author) {
      setMetaContent(ensureMetaByProperty("article:author"), merged.author);
    }
  } else {
    clearManagedMeta('meta[property="article:tag"][data-managed-seo="true"]');
    const publishedMeta = document.head.querySelector<HTMLMetaElement>('meta[property="article:published_time"][data-managed-seo="true"]');
    publishedMeta?.remove();
    const modifiedMeta = document.head.querySelector<HTMLMetaElement>('meta[property="article:modified_time"][data-managed-seo="true"]');
    modifiedMeta?.remove();
    const sectionMeta = document.head.querySelector<HTMLMetaElement>('meta[property="article:section"][data-managed-seo="true"]');
    sectionMeta?.remove();
    const authorMeta = document.head.querySelector<HTMLMetaElement>('meta[property="article:author"][data-managed-seo="true"]');
    authorMeta?.remove();
  }

  updateCanonicalLink(merged.canonical);

  return merged;
}

export function buildPageTitle(section?: string | null): string {
  const cleaned = sanitizeText(section);

  if (!cleaned) {
    return DEFAULT_SEO_BASE.title;
  }

  if (DEFAULT_SEO_BASE.title.includes(cleaned)) {
    return DEFAULT_SEO_BASE.title;
  }

  return `${cleaned} | ${SITE_NAME}`;
}

export function buildArticleSeoMetadata(
  post: Pick<SeoMetadata, "title" | "description" | "image" | "publishedTime" | "modifiedTime" | "author"> & {
    excerpt?: string;
    category?: string;
    topic?: string;
    tags?: string[];
    url?: string;
  },
): SeoMetadata {
  const title = sanitizeText(post.title) || DEFAULT_SEO_BASE.title;
  const description = truncate(
    sanitizeText(post.description || post.excerpt) || DEFAULT_SEO_BASE.description,
    200,
  );

  const keywords = normaliseKeywords([
    ...(Array.isArray(post.tags) ? post.tags : []),
    post.category ?? "",
    post.topic ?? "",
    post.author ?? "",
    title,
  ]);

  return {
    title: buildPageTitle(title),
    description,
    image: post.image,
    imageAlt: title,
    type: "article",
    keywords,
    section: post.category,
    tags: Array.isArray(post.tags) ? post.tags : post.topic ? [post.topic] : undefined,
    publishedTime: post.publishedTime,
    modifiedTime: post.modifiedTime,
    author: post.author,
    url: post.url,
    canonical: post.url,
  };
}

export const DEFAULT_SEO_METADATA: SeoMetadata = { ...DEFAULT_SEO_BASE };
