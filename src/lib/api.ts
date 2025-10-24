import type { CommentListResponse, CommentResponse, CreateCommentRequest } from "../types/comment";
import type { SearchKind, SearchResponse } from "../types/search";
import type { PostCountersUpdate, PostListResponse, PostMyState, PostResponse } from "../types/post";
import { buildPostUrl } from "./urls";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");
const POSTS_ENDPOINT = import.meta.env.VITE_API_POSTS_ENDPOINT ?? "/api/post/getAll";
const EVENTS_ENDPOINT = import.meta.env.VITE_API_EVENTS_ENDPOINT ?? "/api/events";
const UPCOMING_EVENTS_ENDPOINT =
  import.meta.env.VITE_API_UPCOMING_EVENTS_ENDPOINT ?? "/api/events/upcoming";
const TOP_UPCOMING_EVENTS_ENDPOINT =
  import.meta.env.VITE_API_TOP_UPCOMING_EVENTS_ENDPOINT ?? "/api/events/upcoming/top";
const TRANSLATOR_VACANCIES_ENDPOINT =
  import.meta.env.VITE_API_TRANSLATOR_VACANCIES_ENDPOINT ?? "/api/translator-vacancies";
const POSTS_BY_CHAPTER_ENDPOINT =
  import.meta.env.VITE_API_POSTS_BY_CHAPTER_ENDPOINT ?? "/api/posts/by-chapter";
const POSTS_BY_TOPIC_ENDPOINT =
  import.meta.env.VITE_API_POSTS_BY_TOPIC_ENDPOINT ?? "/api/posts/by-topic";
const POPULAR_TOPICS_ENDPOINT =
  import.meta.env.VITE_API_POPULAR_TOPICS_ENDPOINT ?? "/api/posts/topics/popular";
const POST_COUNTERS_ENDPOINT = "/api/post/counters";
const POST_COUNTERS_STREAM_ENDPOINT = "/api/post/live";
const POST_MY_STATE_ENDPOINT = "/api/post/my-state";
const CSRF_COOKIE_NAME = "yw_csrf";
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API_BASE_URL) {
    return normalizedPath;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

function ensureAssetsSegmentUppercase(value: string): string {
  return value.replace(/(^|\/)assets(?=\/)/gi, (_, prefix: string) => `${prefix}ASSETS`);
}

function ensureThumbnailSegment(value: string): string {
  return value.replace(/(^|\/)api\/files(?!\/thumbnail)(?=\/ASSETS\/)/gi, (match) => `${match}/thumbnail`);
}

export function resolveFileUrl(path?: string | null, { defaultPrefix }: { defaultPrefix?: string } = {}): string | undefined {
  if (!path) {
    return undefined;
  }

  const trimmed = ensureThumbnailSegment(ensureAssetsSegmentUppercase(path.trim()));

  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const sanitized = ensureThumbnailSegment(
    ensureAssetsSegmentUppercase(trimmed.replace(/^\/+/, ""))
  );

  if (trimmed.startsWith("/")) {
    return resolveApiUrl(trimmed);
  }

  if (/^api\//i.test(sanitized)) {
    return resolveApiUrl(`/${sanitized}`);
  }

  if (defaultPrefix) {
    const normalizedPrefix = defaultPrefix.endsWith("/") ? defaultPrefix.slice(0, -1) : defaultPrefix;
    const combinedPath = `${normalizedPrefix}/${sanitized}`;
    const normalizedCombined = combinedPath.startsWith("/") ? combinedPath : `/${combinedPath}`;

    return resolveApiUrl(ensureThumbnailSegment(normalizedCombined));
  }

  return resolveApiUrl(`/${sanitized}`);
}

export function buildPostShareUrl(postId?: string | null): string | undefined {
  const trimmedId = postId?.trim();

  if (!trimmedId) {
    return undefined;
  }

  return buildPostUrl(trimmedId);
}

export async function fetchPostShare(
  postId: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<PostResponse | undefined> {
  const trimmedId = postId?.trim();

  if (!trimmedId) {
    return undefined;
  }

  const response = await apiRequest(`/api/post/share/${trimmedId}`, { signal });
  const payload = await parseJsonResponse<PostResponse | { message?: string }>(response);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : undefined) ?? "Не удалось получить публикацию";

    throw new Error(message);
  }

  if (!payload) {
    throw new Error("Публикация не найдена");
  }

  return payload as PostResponse;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(name.length + 1)) || null;
}

async function parseJsonResponse<T>(response: Response): Promise<T | undefined> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error("Не удалось обработать ответ сервера");
  }
}

async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const method = init.method?.toUpperCase() ?? "GET";
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  if (STATE_CHANGING_METHODS.has(method)) {
    const csrfToken = getCookie(CSRF_COOKIE_NAME);

    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  return fetch(resolveApiUrl(path), {
    ...init,
    method,
    credentials: "include",
    headers,
  });
}

interface PaginatedResponse<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}

type ArrayParam = string[] | string | undefined;

function normalizeArrayParam(value: ArrayParam): string | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const sanitized = value
      .map((item) => item?.toString().trim())
      .filter((item): item is string => Boolean(item));

    if (!sanitized.length) {
      return undefined;
    }

    return Array.from(new Set(sanitized)).join(",");
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parts = trimmed
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (!parts.length) {
    return undefined;
  }

  return Array.from(new Set(parts)).join(",");
}

interface FetchTranslatorVacanciesOptions {
  page?: number;
  size?: number;
  q?: string;
  languages?: ArrayParam;
  specialization?: ArrayParam;
  experience?: string;
  location?: string;
  signal?: AbortSignal;
}

function sanitizeSearchKinds(kinds?: SearchKind[] | SearchKind): string | undefined {
  if (!kinds) {
    return undefined;
  }

  if (typeof kinds === "string") {
    const trimmed = kinds.trim();

    if (trimmed) {
      return trimmed
        .split(",")
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean)
        .join(",");
    }

    return undefined;
  }

  const normalized = kinds
    .map((value) => value?.toString().trim().toUpperCase())
    .filter(Boolean);

  if (!normalized.length) {
    return undefined;
  }

  return Array.from(new Set(normalized)).join(",");
}

export async function fetchAllPosts({
  page = 1,
  size = 20,
  signal,
}: {
  page?: number;
  size?: number;
  signal?: AbortSignal;
} = {}): Promise<PostListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const endpoint = `${POSTS_ENDPOINT}${POSTS_ENDPOINT.includes("?") ? "&" : "?"}${params.toString()}`;

  const response = await apiRequest(endpoint, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить список публикаций");
  }

  const parsed = await parseJsonResponse<PostListResponse>(response);

  if (!parsed) {
    return {
      total: 0,
      page,
      size,
      items: [],
    };
  }

  return {
    total: typeof parsed.total === "number" ? parsed.total : 0,
    page: typeof parsed.page === "number" ? parsed.page : page,
    size: typeof parsed.size === "number" ? parsed.size : size,
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

export async function fetchEvents<T>({
  page = 1,
  size = 20,
  signal,
}: {
  page?: number;
  size?: number;
  signal?: AbortSignal;
} = {}): Promise<PaginatedResponse<T>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const response = await apiRequest(`${EVENTS_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить список событий");
  }

  const parsed = await parseJsonResponse<PaginatedResponse<T>>(response);

  if (!parsed) {
    return {
      total: 0,
      page,
      size,
      items: [],
    };
  }

  return {
    total: typeof parsed.total === "number" ? parsed.total : 0,
    page: typeof parsed.page === "number" ? parsed.page : page,
    size: typeof parsed.size === "number" ? parsed.size : size,
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

export async function fetchTopUpcomingEvents<T>({
  size = 3,
  signal,
}: {
  size?: number;
  signal?: AbortSignal;
} = {}): Promise<T[]> {
  const params = new URLSearchParams({
    size: String(size),
  });

  const response = await apiRequest(`${TOP_UPCOMING_EVENTS_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить список ближайших событий");
  }

  const parsed = await parseJsonResponse<T[] | T>(response);

  if (!parsed) {
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  return [parsed];
}

export async function fetchPostsByChapter<T>({
  chapter,
  page = 1,
  size = 20,
  signal,
}: {
  chapter: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
}): Promise<PaginatedResponse<T>> {
  const params = new URLSearchParams({
    chapter,
    page: String(page),
    size: String(size),
  });

  const response = await apiRequest(`${POSTS_BY_CHAPTER_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить публикации раздела");
  }

  const parsed = await parseJsonResponse<PaginatedResponse<T>>(response);

  if (!parsed) {
    return {
      total: 0,
      page,
      size,
      items: [],
    };
  }

  return {
    total: typeof parsed.total === "number" ? parsed.total : 0,
    page: typeof parsed.page === "number" ? parsed.page : page,
    size: typeof parsed.size === "number" ? parsed.size : size,
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

export async function fetchPostsByTopic<T>({
  topic,
  page = 1,
  size = 20,
  signal,
}: {
  topic: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
}): Promise<PaginatedResponse<T>> {
  const params = new URLSearchParams({
    topic,
    page: String(page),
    size: String(size),
  });

  const response = await apiRequest(`${POSTS_BY_TOPIC_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить публикации по теме");
  }

  const parsed = await parseJsonResponse<PaginatedResponse<T>>(response);

  if (!parsed) {
    return {
      total: 0,
      page,
      size,
      items: [],
    };
  }

  return {
    total: typeof parsed.total === "number" ? parsed.total : 0,
    page: typeof parsed.page === "number" ? parsed.page : page,
    size: typeof parsed.size === "number" ? parsed.size : size,
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

export interface PopularTopicItem {
  topic: string;
  postCount: number;
}

export interface PopularTopicsResponse {
  totalTopics: number;
  page: number;
  size: number;
  items: PopularTopicItem[];
}

export async function fetchPopularTopics({
  page = 1,
  size = 5,
  signal,
}: {
  page?: number;
  size?: number;
  signal?: AbortSignal;
} = {}): Promise<PopularTopicsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const response = await apiRequest(`${POPULAR_TOPICS_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить список популярных тем");
  }

  const parsed = await parseJsonResponse<PopularTopicsResponse>(response);

  if (!parsed) {
    return {
      totalTopics: 0,
      page,
      size,
      items: [],
    };
  }

  const normalizedItems = Array.isArray(parsed.items)
    ? parsed.items
        .map((item) => {
          const topic = typeof item?.topic === "string" ? item.topic.trim() : "";
          if (!topic) {
            return null;
          }

          const postCount =
            typeof item?.postCount === "number" && Number.isFinite(item.postCount)
              ? Math.max(0, Math.round(item.postCount))
              : 0;

          return { topic, postCount };
        })
        .filter((item): item is PopularTopicItem => item !== null)
    : [];

  return {
    totalTopics: typeof parsed.totalTopics === "number" ? parsed.totalTopics : normalizedItems.length,
    page: typeof parsed.page === "number" ? parsed.page : page,
    size: typeof parsed.size === "number" ? parsed.size : size,
    items: normalizedItems,
  };
}

export async function fetchTranslatorVacancies<T>({
  page = 1,
  size = 20,
  q,
  languages,
  specialization,
  experience,
  location,
  signal,
}: FetchTranslatorVacanciesOptions = {}): Promise<PaginatedResponse<T>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const trimmedQuery = q?.trim();
  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  const normalizedLanguages = normalizeArrayParam(languages);
  if (normalizedLanguages) {
    params.set("languages", normalizedLanguages);
  }

  const normalizedSpecializations = normalizeArrayParam(specialization);
  if (normalizedSpecializations) {
    params.set("specialization", normalizedSpecializations);
  }

  const trimmedExperience = experience?.trim();
  if (trimmedExperience) {
    params.set("experience", trimmedExperience);
  }

  const trimmedLocation = location?.trim();
  if (trimmedLocation) {
    params.set("location", trimmedLocation);
  }

  const response = await apiRequest(`${TRANSLATOR_VACANCIES_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить список переводчиков");
  }

  const parsed = await parseJsonResponse<PaginatedResponse<T>>(response);

  if (!parsed) {
    return {
      total: 0,
      page,
      size,
      items: [],
    };
  }

  return {
    total: typeof parsed.total === "number" ? parsed.total : 0,
    page: typeof parsed.page === "number" ? parsed.page : page,
    size: typeof parsed.size === "number" ? parsed.size : size,
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

export async function fetchPostCounters(
  ids: string[],
  signal?: AbortSignal,
): Promise<PostCountersUpdate[]> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const sanitizedIds = ids.filter((id) => typeof id === "string" && id.trim() !== "");

  if (sanitizedIds.length === 0) {
    return [];
  }

  const params = new URLSearchParams({ ids: sanitizedIds.join(",") });

  const response = await apiRequest(`${POST_COUNTERS_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить счётчики публикаций");
  }

  const parsed = await parseJsonResponse<PostCountersUpdate[] | PostCountersUpdate>(response);

  const normalize = (value: unknown): PostCountersUpdate[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is PostCountersUpdate => typeof item === "object" && item !== null);
    }

    if (value && typeof value === "object") {
      return [value as PostCountersUpdate];
    }

    return [];
  };

  return normalize(parsed)
    .map((item) => {
      const identifier =
        typeof item.id === "string" && item.id.trim() !== ""
          ? item.id.trim()
          : typeof item.postId === "string" && item.postId.trim() !== ""
            ? item.postId.trim()
            : undefined;

      if (!identifier) {
        return undefined;
      }

      const likeCount =
        typeof item.likeCount === "number" && Number.isFinite(item.likeCount)
          ? item.likeCount
          : undefined;
      const dislikeCount =
        typeof item.dislikeCount === "number" && Number.isFinite(item.dislikeCount)
          ? item.dislikeCount
          : undefined;
      const viewCount =
        typeof item.viewCount === "number" && Number.isFinite(item.viewCount)
          ? item.viewCount
          : undefined;
      const commentCount =
        typeof item.commentCount === "number" && Number.isFinite(item.commentCount)
          ? item.commentCount
          : undefined;

      return {
        id: identifier,
        postId:
          typeof item.postId === "string" && item.postId.trim() !== ""
            ? item.postId.trim()
            : identifier,
        likeCount,
        dislikeCount,
        viewCount,
        commentCount,
      } satisfies PostCountersUpdate;
    })
    .filter((item): item is PostCountersUpdate => Boolean(item));
}

export function createPostCountersEventSource(ids: string[]): EventSource {
  const sanitizedIds = Array.isArray(ids)
    ? ids.filter((id) => typeof id === "string" && id.trim() !== "")
    : [];

  if (sanitizedIds.length === 0) {
    throw new Error("Невозможно подписаться на пустой список публикаций");
  }

  const params = new URLSearchParams({ ids: sanitizedIds.join(",") });
  const url = `${POST_COUNTERS_STREAM_ENDPOINT}?${params.toString()}`;

  return new EventSource(buildUrl(url), { withCredentials: true });
}

export async function fetchPostMyState(
  ids: string[],
  signal?: AbortSignal,
): Promise<PostMyState[]> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  const sanitizedIds = ids
    .filter((id) => typeof id === "string" && id.trim() !== "")
    .map((id) => id.trim());

  if (sanitizedIds.length === 0) {
    return [];
  }

  const params = new URLSearchParams({ ids: sanitizedIds.join(",") });

  const response = await apiRequest(`${POST_MY_STATE_ENDPOINT}?${params.toString()}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить пользовательское состояние публикаций");
  }

  const parsed = await parseJsonResponse<PostMyState[] | PostMyState>(response);

  const normalize = (value: unknown): PostMyState[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is PostMyState => typeof item === "object" && item !== null);
    }

    if (value && typeof value === "object") {
      return [value as PostMyState];
    }

    return [];
  };

  return normalize(parsed)
    .map((item) => {
      const identifier =
        typeof item.id === "string" && item.id.trim() !== ""
          ? item.id.trim()
          : typeof item.postId === "string" && item.postId.trim() !== ""
            ? item.postId.trim()
            : undefined;

      if (!identifier) {
        return undefined;
      }

      const result: PostMyState = {
        id: identifier,
        postId:
          typeof item.postId === "string" && item.postId.trim() !== ""
            ? item.postId.trim()
            : identifier,
      };

      const rawReaction =
        item.myReaction !== undefined ? item.myReaction : (item.reaction as PostMyState["myReaction"]);

      let normalizedReaction: PostMyState["myReaction"] | undefined;

      if (typeof rawReaction === "string") {
        const lowered = rawReaction.trim().toLowerCase();

        if (lowered === "like") {
          normalizedReaction = "like";
        } else if (lowered === "dislike") {
          normalizedReaction = "dislike";
        } else if (lowered === "" || lowered === "none" || lowered === "neutral") {
          normalizedReaction = null;
        }
      } else if (rawReaction === null) {
        normalizedReaction = null;
      }

      if (normalizedReaction === undefined) {
        const likedFlag = typeof item.liked === "boolean" ? item.liked : undefined;
        const dislikedFlag = typeof item.disliked === "boolean" ? item.disliked : undefined;

        if (likedFlag === true && dislikedFlag !== true) {
          normalizedReaction = "like";
        } else if (dislikedFlag === true && likedFlag !== true) {
          normalizedReaction = "dislike";
        } else if (likedFlag === false && dislikedFlag === false) {
          normalizedReaction = null;
        }
      }

      if (normalizedReaction !== undefined) {
        result.myReaction = normalizedReaction;
        result.reaction = normalizedReaction;
      }

      const viewedValue =
        typeof item.viewed === "boolean"
          ? item.viewed
          : typeof item.hasViewed === "boolean"
            ? item.hasViewed
            : undefined;

      if (viewedValue !== undefined) {
        result.viewed = viewedValue;
        result.hasViewed = viewedValue;
      }

      return result;
    })
    .filter((item): item is PostMyState => Boolean(item));
}

async function sendReactionRequest(
  postId: string,
  action: "view" | "like" | "dislike"
): Promise<PostResponse | undefined> {
  const response = await apiRequest(`/api/post/reaction/${postId}/${action}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Не удалось обновить реакцию на публикацию");
  }

  try {
    return await parseJsonResponse<PostResponse>(response);
  } catch (error) {
    return undefined;
  }
}

async function deleteReactionRequest(postId: string): Promise<PostResponse | undefined> {
  const response = await apiRequest(`/api/post/reaction/${postId}/reaction`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Не удалось удалить реакцию на публикацию");
  }

  try {
    return await parseJsonResponse<PostResponse>(response);
  } catch (error) {
    return undefined;
  }
}

export function registerPostView(postId: string): Promise<PostResponse | undefined> {
  return sendReactionRequest(postId, "view");
}

export function sendPostLike(postId: string): Promise<PostResponse | undefined> {
  return sendReactionRequest(postId, "like");
}

export function sendPostDislike(postId: string): Promise<PostResponse | undefined> {
  return sendReactionRequest(postId, "dislike");
}

export function clearPostReaction(postId: string): Promise<PostResponse | undefined> {
  return deleteReactionRequest(postId);
}

export async function fetchComments(
  postId: string,
  {
    page = 1,
    size = 20,
    signal,
  }: { page?: number; size?: number; signal?: AbortSignal } = {}
): Promise<CommentListResponse> {
  const response = await apiRequest(`/api/comment/action/${postId}/comments?page=${page}&size=${size}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить список комментариев");
  }

  const parsed = await parseJsonResponse<CommentListResponse>(response);

  if (!parsed) {
    return {
      total: 0,
      page,
      size,
      items: [],
    };
  }

  return parsed;
}

export async function createComment(
  postId: string,
  payload: CreateCommentRequest
): Promise<CommentResponse | undefined> {
  const response = await apiRequest(`/api/comment/action/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Не удалось добавить комментарий");
  }

  return parseJsonResponse<CommentResponse>(response);
}

export async function searchContent({
  query,
  page = 1,
  size = 10,
  kinds,
  signal,
}: {
  query: string;
  page?: number;
  size?: number;
  kinds?: SearchKind[] | SearchKind;
  signal?: AbortSignal;
}): Promise<SearchResponse> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      total: 0,
      page,
      size,
      items: [],
    };
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
    page: String(page),
    size: String(size),
  });

  const normalizedKinds = sanitizeSearchKinds(kinds);

  if (normalizedKinds) {
    params.set("kinds", normalizedKinds);
  }

  const endpoint = `/api/search?${params.toString()}`;

  const response = await apiRequest(endpoint, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось выполнить поиск");
  }

  const parsed = await parseJsonResponse<SearchResponse>(response);

  if (!parsed) {
    return {
      total: 0,
      page,
      size,
      items: [],
    };
  }

  return {
    total: typeof parsed.total === "number" ? parsed.total : 0,
    page: typeof parsed.page === "number" ? parsed.page : page,
    size: typeof parsed.size === "number" ? parsed.size : size,
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

async function sendCommentReactionRequest(
  commentId: string,
  action: "like" | "dislike"
): Promise<CommentResponse | undefined> {
  const response = await apiRequest(`/api/comment/action/${commentId}/${action}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Не удалось обновить реакцию на комментарий");
  }

  try {
    return await parseJsonResponse<CommentResponse>(response);
  } catch (error) {
    return undefined;
  }
}

async function deleteCommentReactionRequest(commentId: string): Promise<CommentResponse | undefined> {
  const response = await apiRequest(`/api/comment/action/${commentId}/reaction`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Не удалось удалить реакцию на комментарий");
  }

  try {
    return await parseJsonResponse<CommentResponse>(response);
  } catch (error) {
    return undefined;
  }
}

export function sendCommentLike(commentId: string): Promise<CommentResponse | undefined> {
  return sendCommentReactionRequest(commentId, "like");
}

export function sendCommentDislike(commentId: string): Promise<CommentResponse | undefined> {
  return sendCommentReactionRequest(commentId, "dislike");
}

export function clearCommentReaction(commentId: string): Promise<CommentResponse | undefined> {
  return deleteCommentReactionRequest(commentId);
}
