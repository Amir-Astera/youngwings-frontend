import type { CommentListResponse, CommentResponse, CreateCommentRequest } from "../types/comment";
import type { PostCountersUpdate, PostListResponse, PostResponse } from "../types/post";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");
const POSTS_ENDPOINT = import.meta.env.VITE_API_POSTS_ENDPOINT ?? "/api/post/getAll";
const POST_COUNTERS_ENDPOINT = "/api/post/counters";
const POST_COUNTERS_STREAM_ENDPOINT = "/api/post/counters/stream";
const CSRF_COOKIE_NAME = "yw_csrf";
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API_BASE_URL) {
    return normalizedPath;
  }

  return `${API_BASE_URL}${normalizedPath}`;
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

  return fetch(buildUrl(path), {
    ...init,
    method,
    credentials: "include",
    headers,
  });
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

  return normalize(parsed).filter((item) => typeof item.id === "string" && item.id.trim() !== "");
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
