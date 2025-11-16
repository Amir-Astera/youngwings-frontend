import { buildAbsoluteUrl } from "./urls";

export const SITE_NAME = "OrientVentus";
export const SITE_TAGLINE = "Медиа о бизнесе, стартапах и инновациях в Китае";
export const SITE_DESCRIPTION =
  "OrientVentus — независимая медиа-платформа, которая рассказывает о бизнесе, стартапах и инновациях в Китае для русскоязычной аудитории.";

const DEFAULT_OG_IMAGE_PATH = "/assets/og-default.jpg";
const DEFAULT_PUBLISHER_LOGO_PATH = DEFAULT_OG_IMAGE_PATH;

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

export type StructuredData = Record<string, unknown>;

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
  structuredData?: StructuredData | StructuredData[] | null;
}

const DEFAULT_SEO_BASE: Required<Pick<SeoMetadata, "title" | "description" | "keywords" | "type" | "image" | "imageAlt" | "robots">> &
  Pick<SeoMetadata, "author"> = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  type: "website",
  image: DEFAULT_OG_IMAGE_PATH,
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

  return buildAbsoluteUrl(url);
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

function updateStructuredData(data?: StructuredData | StructuredData[] | null): void {
  if (typeof document === "undefined") {
    return;
  }

  const existing = document.head.querySelector<HTMLScriptElement>(
    'script[type="application/ld+json"][data-managed-seo="true"]',
  );

  if (!data || (Array.isArray(data) && data.length === 0)) {
    existing?.remove();
    return;
  }

  const payload = JSON.stringify(data, null, 2);

  if (existing) {
    existing.textContent = payload;
    return;
  }

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.managedSeo = "true";
  script.textContent = payload;
  document.head.appendChild(script);
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

  const resolvedUrl = buildAbsoluteUrl(overrides.url);
  const resolvedCanonical = buildAbsoluteUrl(overrides.canonical ?? resolvedUrl);

  if (typeof window !== "undefined") {
    merged.url = resolvedUrl ?? window.location.href;
    merged.canonical = resolvedCanonical ?? merged.url;
  } else {
    merged.url = resolvedUrl;
    merged.canonical = resolvedCanonical ?? resolvedUrl;
  }

  merged.image = toAbsoluteUrl(merged.image ?? base.image);
  merged.structuredData = overrides.structuredData;

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
  updateStructuredData(merged.structuredData);

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

interface ArticleMetadataInput
  extends Pick<SeoMetadata, "title" | "description" | "image" | "publishedTime" | "modifiedTime" | "author"> {
  excerpt?: string;
  category?: string;
  topic?: string;
  tags?: string[];
  url?: string;
}

export function buildArticleStructuredData(post: {
  title: string;
  description: string;
  image?: string | null;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  url?: string;
}): StructuredData {
  const absoluteImage = toAbsoluteUrl(post.image ?? DEFAULT_OG_IMAGE_PATH);
  const datePublished = formatIsoDate(post.publishedTime);
  const dateModified = formatIsoDate(post.modifiedTime) ?? datePublished;
  const absoluteUrl = toAbsoluteUrl(post.url);
  const publisherLogo = toAbsoluteUrl(DEFAULT_PUBLISHER_LOGO_PATH);

  const structuredData: StructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: sanitizeText(post.title) || SITE_NAME,
    description: truncate(sanitizeText(post.description) || SITE_DESCRIPTION, 200),
    image: absoluteImage ? [absoluteImage] : undefined,
    datePublished,
    dateModified,
    mainEntityOfPage: absoluteUrl
      ? {
          "@type": "WebPage",
          "@id": absoluteUrl,
        }
      : undefined,
    url: absoluteUrl,
    author: post.author
      ? {
          "@type": "Person",
          name: sanitizeText(post.author),
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: publisherLogo
        ? {
            "@type": "ImageObject",
            url: publisherLogo,
          }
        : undefined,
    },
  };

  Object.keys(structuredData).forEach((key) => {
    const value = structuredData[key as keyof typeof structuredData];

    if (value === undefined || value === null || value === "") {
      delete structuredData[key as keyof typeof structuredData];
    }
  });

  return structuredData;
}

export function buildArticleSeoMetadata(post: ArticleMetadataInput): SeoMetadata {
  const title = sanitizeText(post.title) || DEFAULT_SEO_BASE.title;
  const description = truncate(
    sanitizeText(post.description || post.excerpt) || DEFAULT_SEO_BASE.description,
    160,
  );

  const keywords = normaliseKeywords([
    ...(Array.isArray(post.tags) ? post.tags : []),
    post.category ?? "",
    post.topic ?? "",
    post.author ?? "",
    title,
  ]);

  const canonicalUrl = toAbsoluteUrl(post.url);
  const publishedTime = formatIsoDate(post.publishedTime);
  const modifiedTime = formatIsoDate(post.modifiedTime) ?? publishedTime;

  return {
    title: `${title} — ${SITE_NAME}`,
    description,
    image: post.image,
    imageAlt: title,
    type: "article",
    keywords,
    section: post.category,
    tags: Array.isArray(post.tags) ? post.tags : post.topic ? [post.topic] : undefined,
    publishedTime,
    modifiedTime,
    author: post.author,
    url: canonicalUrl,
    canonical: canonicalUrl,
    structuredData: buildArticleStructuredData({
      title,
      description,
      image: post.image,
      publishedTime,
      modifiedTime,
      author: post.author,
      url: canonicalUrl,
    }),
  };
}

export const DEFAULT_SEO_METADATA: SeoMetadata = { ...DEFAULT_SEO_BASE };
