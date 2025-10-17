import type { PostResponse } from "../types/post";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");
const POSTS_ENDPOINT = import.meta.env.VITE_API_POSTS_ENDPOINT ?? "/api/post/getAll";

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

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return [] as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error("Не удалось обработать ответ сервера");
  }
}

export async function fetchAllPosts(signal?: AbortSignal): Promise<PostResponse[]> {
  const response = await fetch(buildUrl(POSTS_ENDPOINT), {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error("Не удалось получить список публикаций");
  }

  return parseJsonResponse<PostResponse[]>(response);
}
