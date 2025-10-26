import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LeftSidebar } from "./components/LeftSidebar";
import { TopHeader } from "./components/TopHeader";
import { MobileMenu } from "./components/MobileMenu";
import { NewsCard } from "./components/NewsCard";
import { RightSidebar } from "./components/RightSidebar";
import { EventsPage } from "./components/EventsPage";
import { TopicPage } from "./components/TopicPage";
import { UpcomingEventsPage } from "./components/UpcomingEventsPage";
import { AboutPage } from "./components/AboutPage";
import { ExhibitionsPage } from "./components/ExhibitionsPage";
import { TranslatorsPage } from "./components/TranslatorsPage";
import { ContactsPage } from "./components/ContactsPage";
import { SubsectionPage } from "./components/SubsectionPage";
import { PostPage } from "./components/PostPage";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import {
  createPostCountersEventSource,
  fetchAllPosts,
  fetchPostsByChapter,
  fetchPostsByTopic,
  fetchPostCounters,
  fetchPostMyState,
  fetchPostShare,
  resolveFileUrl,
} from "./lib/api";
import { formatRelativeTime } from "./lib/dates";
import { useVisiblePosts } from "./lib/useVisiblePosts";
import { buildPostPath, extractPostIdFromLocation, getBasePath } from "./lib/urls";
const APP_BASE_PATH = getBasePath();

import type {
  PostCountersState,
  PostCountersUpdate,
  PostMyState,
  PostPersonalState,
  PostResponse,
  PostSummary,
} from "./types/post";
import { markViewRecorded } from "./lib/clientState";

function extractPlainTextFromContent(content?: string): string {
  if (!content) {
    return "";
  }

  try {
    const parsed = JSON.parse(content);
    const pieces: string[] = [];

    const walk = (node: unknown): void => {
      if (!node) {
        return;
      }

      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }

      if (typeof node !== "object") {
        return;
      }

      const typedNode = node as { type?: string; text?: string; content?: unknown };

      if (typedNode.type === "text" && typeof typedNode.text === "string") {
        pieces.push(typedNode.text);
      }

      if (typedNode.content) {
        walk(typedNode.content);
      }
    };

    walk(parsed);

    return pieces.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return content.trim();
  }
}

function getDisplayDate(createdAt?: string): string {
  if (!createdAt) {
    return "";
  }

  const relative = formatRelativeTime(createdAt);

  if (relative) {
    return relative;
  }

  const date = new Date(createdAt);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return "";
}

function mapPostResponseToSummary(post: PostResponse): PostSummary {
  const title = (post.title ?? "").trim();
  const excerptSource = (post.description ?? "").trim() || extractPlainTextFromContent(post.content);
  const rawThumbnail = typeof post.thumbnail === "string" ? post.thumbnail.trim() : "";
  let image: string | undefined;

  if (rawThumbnail && !/^(нет\s+фотки?|string)$/i.test(rawThumbnail)) {
    const sanitized = rawThumbnail.replace(/^\/+/, "");

    if (/^https?:\/\//i.test(rawThumbnail)) {
      image = rawThumbnail;
    } else if (rawThumbnail.startsWith("/")) {
      image = resolveFileUrl(rawThumbnail) ?? undefined;
    } else if (/^api\//i.test(sanitized)) {
      image = resolveFileUrl(`/${sanitized}`) ?? undefined;
    } else {
      image = resolveFileUrl(sanitized, { defaultPrefix: "/api/files/thumbnail" }) ?? undefined;
    }
  }
  const category = (post.chapter ?? "").trim();
  const topic = (post.topic ?? "").trim();
  const author = (post.author ?? "").trim();

  return {
    id: post.id,
    title,
    excerpt: excerptSource,
    image,
    category: category || "Главная",
    date: getDisplayDate(post.createdAt),
    likes: typeof post.likeCount === "number" ? post.likeCount : 0,
    dislikes: typeof post.dislikeCount === "number" ? post.dislikeCount : 0,
    comments: typeof post.commentCount === "number" ? post.commentCount : 0,
    views: typeof post.viewCount === "number" ? post.viewCount : 0,
    author: author || undefined,
    topic: topic || undefined,
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    raw: post,
    myReaction: null,
    hasViewed: false,
  };
}

function normalizeReaction(
  reaction: unknown,
  liked: unknown,
  disliked: unknown,
): PostPersonalState["reaction"] | undefined {
  if (typeof reaction === "string") {
    const normalized = reaction.trim().toLowerCase();

    if (normalized === "like") {
      return "like";
    }

    if (normalized === "dislike") {
      return "dislike";
    }

    if (normalized === "" || normalized === "none" || normalized === "neutral") {
      return null;
    }
  }

  if (reaction === null) {
    return null;
  }

  const likedFlag = typeof liked === "boolean" ? liked : undefined;
  const dislikedFlag = typeof disliked === "boolean" ? disliked : undefined;

  if (likedFlag === true && dislikedFlag !== true) {
    return "like";
  }

  if (dislikedFlag === true && likedFlag !== true) {
    return "dislike";
  }

  if (likedFlag === false && dislikedFlag === false) {
    return null;
  }

  return undefined;
}

function normalizeViewed(viewed: unknown, hasViewed: unknown): boolean | undefined {
  if (typeof viewed === "boolean") {
    return viewed;
  }

  if (typeof hasViewed === "boolean") {
    return hasViewed;
  }

  return undefined;
}



const subsectionDescriptions: { [key: string]: string } = {
  "Бизнес и стартапы": "Новости стартап-экосистемы, истории успеха и советы для предпринимателей",
  "Экономика и финансы": "Анализ экономических тенденций, финансовые новости и инвестиции",
  "Рынок и аналитика": "Исследования рынка, аналитика и прогнозы развития индустрии",
  "Технологии и инновации": "Последние достижения в мире технологий и инновационные решения",
  "Маркетинг и бренды": "Тренды маркетинга, кейсы успешных брендов и стратегии продвижения",
  "Потребление и лайфстайл": "Влияние технологий на повседневную жизнь и потребительские тренды",
  "Международный бизнес": "Глобальные бизнес-тренды и выход на международные рынки",
  "Медиа и контент": "Контент-маркетинг, медиа-стратегии и создание вовлекающего контента",
  "Мнения и аналитика": "Экспертные мнения, колонки и глубокая аналитика",
  "Авто и транспорт": "Новости автомобильной индустрии и транспортных технологий",
};

function getSubsectionDescription(subsection: string): string {
  return subsectionDescriptions[subsection] || "Актуальные материалы по теме";
}

const POSTS_PAGE_SIZE = 20;
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];

type PostCountersPatch = {
  likes?: number;
  dislikes?: number;
  views?: number;
  comments?: number;
};

interface SectionPostsState {
  items: PostSummary[];
  isLoading: boolean;
  error: string | null;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [viewingPost, setViewingPost] = useState(false);
  const [translatorsSidebarFilters, setTranslatorsSidebarFilters] = useState<ReactNode | null>(null);
  const [currentPostData, setCurrentPostData] = useState<PostSummary | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [countersById, setCountersById] = useState<Record<string, PostCountersState>>({});
  const [personalStateById, setPersonalStateById] = useState<Record<string, PostPersonalState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subsectionStates, setSubsectionStates] = useState<Record<string, SectionPostsState>>({});
  const [topicStates, setTopicStates] = useState<Record<string, SectionPostsState>>({});
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [isStandalonePostLoading, setIsStandalonePostLoading] = useState(false);
  const [standalonePostError, setStandalonePostError] = useState<string | null>(null);
  const { register: registerPostVisibility, visibleIds: observedVisibleIds } = useVisiblePosts();
  const [debouncedVisibleIds, setDebouncedVisibleIds] = useState<string[]>([]);
  const countersRef = useRef<Record<string, PostCountersState>>({});
  const postsRef = useRef<PostSummary[]>([]);
  const currentPostRef = useRef<PostSummary | null>(null);
  const personalStateRef = useRef<Record<string, PostPersonalState>>({});
  const standalonePostControllerRef = useRef<AbortController | null>(null);
  const initialRouteHandledRef = useRef(false);
  const pendingCountersRef = useRef<Map<string, PostCountersPatch>>(new Map());
  const updateHistoryToPost = useCallback((postId: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const path = buildPostPath(postId);
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    if (currentPath === path && !currentSearch) {
      window.history.replaceState({ postId }, "", path);
      return;
    }

    window.history.pushState({ postId }, "", path);
  }, []);

  const navigateToBase = useCallback(({ replace }: { replace?: boolean } = {}) => {
    if (typeof window === "undefined") {
      return;
    }

    const targetPath = APP_BASE_PATH;

    if (replace) {
      window.history.replaceState({}, "", targetPath);
    } else {
      window.history.pushState({}, "", targetPath);
    }
  }, []);

  const openPost = useCallback(
    (postData: PostSummary, options: { skipHistory?: boolean } = {}) => {
      if (!postData?.id) {
        return;
      }

      const counters = countersRef.current[postData.id];
      const personal = personalStateRef.current[postData.id];
      const enrichedPost: PostSummary = {
        ...postData,
        likes: counters?.likes ?? postData.likes ?? 0,
        dislikes: counters?.dislikes ?? postData.dislikes ?? 0,
        comments: counters?.comments ?? postData.comments ?? 0,
        views: counters?.views ?? postData.views ?? 0,
        myReaction: personal?.reaction ?? postData.myReaction ?? null,
        hasViewed: personal?.viewed ?? postData.hasViewed ?? false,
      };

      setCurrentPostData(enrichedPost);
      setViewingPost(true);
      setStandalonePostError(null);
      setIsStandalonePostLoading(false);

      if (typeof window !== "undefined") {
        if (options.skipHistory) {
          window.history.replaceState(
            { postId: postData.id },
            "",
            `${window.location.pathname}${window.location.search}${window.location.hash}`
          );
        } else {
          updateHistoryToPost(postData.id);
        }
      }
    },
    [updateHistoryToPost],
  );

  const loadPostById = useCallback(
    async (postId: string, options: { skipHistory?: boolean } = {}) => {
      const trimmedId = postId?.trim();

      if (!trimmedId) {
        return;
      }

      const existing =
        postsRef.current.find((item) => item.id === trimmedId) ??
        (currentPostRef.current && currentPostRef.current.id === trimmedId ? currentPostRef.current : null);

      if (existing) {
        openPost(existing, options);
        return;
      }

      standalonePostControllerRef.current?.abort();
      const controller = new AbortController();
      standalonePostControllerRef.current = controller;

      setStandalonePostError(null);
      setIsStandalonePostLoading(true);
      setViewingPost(true);
      setCurrentPostData((previous) => (previous?.id === trimmedId ? previous : null));

      try {
        const response = await fetchPostShare(trimmedId, { signal: controller.signal });

        if (!response) {
          throw new Error("Публикация не найдена");
        }

        const summary = mapPostResponseToSummary(response);
        openPost(summary, options);
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          caughtError instanceof Error && caughtError.message
            ? caughtError.message
            : "Не удалось загрузить публикацию";

        setStandalonePostError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsStandalonePostLoading(false);
        }

        if (standalonePostControllerRef.current === controller) {
          standalonePostControllerRef.current = null;
        }
      }
    },
    [openPost],
  );

  const flushFrameRef = useRef<number | null>(null);

  const mergePostsIntoState = useCallback(
    (incoming: PostSummary[]) => {
      if (!Array.isArray(incoming) || incoming.length === 0) {
        return;
      }

      setPosts((previous) => {
        if (!previous.length) {
          const sorted = [...incoming].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
          });

          return sorted;
        }

        const map = new Map<string, PostSummary>();

        for (const item of previous) {
          map.set(item.id, item);
        }

        let changed = false;

        for (const item of incoming) {
          if (!item?.id) {
            continue;
          }

          const existing = map.get(item.id);

          if (!existing) {
            map.set(item.id, item);
            changed = true;
            continue;
          }

          const nextItem: PostSummary = {
            ...existing,
            ...item,
            myReaction: existing.myReaction ?? item.myReaction ?? null,
            hasViewed: existing.hasViewed ?? item.hasViewed ?? false,
            raw: item.raw ?? existing.raw,
          };

          if (
            existing.title !== nextItem.title ||
            existing.excerpt !== nextItem.excerpt ||
            existing.image !== nextItem.image ||
            existing.category !== nextItem.category ||
            existing.topic !== nextItem.topic ||
            existing.author !== nextItem.author ||
            existing.date !== nextItem.date ||
            existing.likes !== nextItem.likes ||
            existing.dislikes !== nextItem.dislikes ||
            existing.comments !== nextItem.comments ||
            existing.views !== nextItem.views ||
            existing.createdAt !== nextItem.createdAt ||
            existing.updatedAt !== nextItem.updatedAt
          ) {
            map.set(item.id, nextItem);
            changed = true;
          }
        }

        if (!changed) {
          return previous;
        }

        const merged = Array.from(map.values());

        merged.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

        return merged;
      });

      setCountersById((previous) => {
        let next = previous;
        let changed = false;

        for (const item of incoming) {
          if (!item?.id) {
            continue;
          }

          const counters: PostCountersState = {
            likes: typeof item.likes === "number" && Number.isFinite(item.likes) ? item.likes : 0,
            dislikes: typeof item.dislikes === "number" && Number.isFinite(item.dislikes) ? item.dislikes : 0,
            comments: typeof item.comments === "number" && Number.isFinite(item.comments) ? item.comments : 0,
            views: typeof item.views === "number" && Number.isFinite(item.views) ? item.views : 0,
          };

          const existing = previous[item.id];

          if (
            !existing ||
            existing.likes !== counters.likes ||
            existing.dislikes !== counters.dislikes ||
            existing.comments !== counters.comments ||
            existing.views !== counters.views
          ) {
            if (!changed) {
              next = { ...previous };
              changed = true;
            }

            next[item.id] = counters;
          }
        }

        return changed ? next : previous;
      });

      setCurrentPostData((previous) => {
        if (!previous) {
          return previous;
        }

        const updated = incoming.find((item) => item.id === previous.id);

        if (!updated) {
          return previous;
        }

        return {
          ...previous,
          ...updated,
          raw: updated.raw ?? previous.raw,
        } satisfies PostSummary;
      });
    },
    [],
  );

  const loadSubsectionPosts = useCallback(
    async (
      subsection: string,
      { signal, force = false }: { signal?: AbortSignal; force?: boolean } = {},
    ) => {
      const key = subsection.trim();

      if (!key) {
        return;
      }

      let shouldFetch = true;

      setSubsectionStates((previous) => {
        const current = previous[key];

        if (!force && current?.isLoading) {
          shouldFetch = false;
          return previous;
        }

        return {
          ...previous,
          [key]: {
            items: current?.items ?? [],
            isLoading: true,
            error: null,
          },
        } satisfies Record<string, SectionPostsState>;
      });

      if (!shouldFetch) {
        return;
      }

      try {
        const response = await fetchPostsByChapter<PostResponse>({
          chapter: key,
          page: 1,
          size: POSTS_PAGE_SIZE,
          signal,
        });

        if (signal?.aborted) {
          return;
        }

        const items = Array.isArray(response.items) ? response.items : [];

        const normalized = items.map((item) => {
          const summary = mapPostResponseToSummary(item);
          const personal = personalStateRef.current[summary.id];

          if (!personal) {
            return summary;
          }

          return {
            ...summary,
            myReaction: personal.reaction ?? null,
            hasViewed: Boolean(personal.viewed),
          } satisfies PostSummary;
        });

        setSubsectionStates((previous) => ({
          ...previous,
          [key]: {
            items: normalized,
            isLoading: false,
            error: null,
          },
        }));

        mergePostsIntoState(normalized);
      } catch (caughtError) {
        if (signal?.aborted) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Не удалось загрузить публикации раздела";

        setSubsectionStates((previous) => {
          const current = previous[key];

          return {
            ...previous,
            [key]: {
              items: current?.items ?? [],
              isLoading: false,
              error: message,
            },
          };
        });
      }
    },
    [mergePostsIntoState],
  );

  const loadTopicPosts = useCallback(
    async (
      topic: string,
      { signal, force = false }: { signal?: AbortSignal; force?: boolean } = {},
    ) => {
      const key = topic.trim();

      if (!key) {
        return;
      }

      let shouldFetch = true;

      setTopicStates((previous) => {
        const current = previous[key];

        if (!force && current?.isLoading) {
          shouldFetch = false;
          return previous;
        }

        return {
          ...previous,
          [key]: {
            items: current?.items ?? [],
            isLoading: true,
            error: null,
          },
        } satisfies Record<string, SectionPostsState>;
      });

      if (!shouldFetch) {
        return;
      }

      try {
        const response = await fetchPostsByTopic<PostResponse>({
          topic: key,
          page: 1,
          size: POSTS_PAGE_SIZE,
          signal,
        });

        if (signal?.aborted) {
          return;
        }

        const items = Array.isArray(response.items) ? response.items : [];

        const normalized = items.map((item) => {
          const summary = mapPostResponseToSummary(item);
          const personal = personalStateRef.current[summary.id];

          if (!personal) {
            return summary;
          }

          return {
            ...summary,
            myReaction: personal.reaction ?? null,
            hasViewed: Boolean(personal.viewed),
          } satisfies PostSummary;
        });

        setTopicStates((previous) => ({
          ...previous,
          [key]: {
            items: normalized,
            isLoading: false,
            error: null,
          },
        }));

        mergePostsIntoState(normalized);
      } catch (caughtError) {
        if (signal?.aborted) {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Не удалось загрузить публикации по теме";

        setTopicStates((previous) => {
          const current = previous[key];

          return {
            ...previous,
            [key]: {
              items: current?.items ?? [],
              isLoading: false,
              error: message,
            },
          };
        });
      }
    },
    [mergePostsIntoState],
  );

  useEffect(() => {
    countersRef.current = countersById;
  }, [countersById]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    currentPostRef.current = currentPostData;
  }, [currentPostData]);

  useEffect(() => {
    personalStateRef.current = personalStateById;
  }, [personalStateById]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const synchronizeWithLocation = () => {
      const postId = extractPostIdFromLocation(window.location);

      if (postId) {
        void loadPostById(postId, { skipHistory: true });
        return;
      }

      standalonePostControllerRef.current?.abort();
      setIsStandalonePostLoading(false);
      setStandalonePostError(null);
      setViewingPost(false);
      setCurrentPostData(null);
    };

    synchronizeWithLocation();
    window.addEventListener("popstate", synchronizeWithLocation);

    return () => {
      window.removeEventListener("popstate", synchronizeWithLocation);
      standalonePostControllerRef.current?.abort();
    };
  }, [loadPostById]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncPageFromSearch = () => {
      const params = new URLSearchParams(window.location.search || "");
      const section = params.get("section")?.trim().toLowerCase();
      const eventParam = params.get("event") ?? params.get("eventId");

      if (section === "events") {
        const trimmedEventId = eventParam?.trim() || null;

        setHighlightedEventId(trimmedEventId);
        setCurrentPage((previous) => (previous === "events" ? previous : "events"));
      } else {
        setHighlightedEventId(null);
      }
    };

    syncPageFromSearch();
    window.addEventListener("popstate", syncPageFromSearch);

    return () => {
      window.removeEventListener("popstate", syncPageFromSearch);
    };
  }, []);

  useEffect(() => {
    return () => {
      pendingCountersRef.current.clear();

      if (flushFrameRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(flushFrameRef.current);
      }

      flushFrameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (currentPage !== "events") {
      setHighlightedEventId(null);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!currentPage.startsWith("subsection-")) {
      return;
    }

    const subsection = currentPage.replace("subsection-", "").trim();

    if (!subsection) {
      return;
    }

    if (subsectionStates[subsection]) {
      return;
    }

    const controller = new AbortController();

    void loadSubsectionPosts(subsection, { signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [currentPage, loadSubsectionPosts, subsectionStates]);

  useEffect(() => {
    if (!currentPage.startsWith("topic-")) {
      return;
    }

    const topic = currentPage.replace("topic-", "").trim();

    if (!topic) {
      return;
    }

    if (topicStates[topic]) {
      return;
    }

    const controller = new AbortController();

    void loadTopicPosts(topic, { signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [currentPage, loadTopicPosts, topicStates]);

  const sortedVisibleIds = useMemo(() => {
    if (!posts.length || observedVisibleIds.length === 0) {
      return [];
    }

    const visibleSet = new Set(observedVisibleIds);
    return posts.filter((item) => visibleSet.has(item.id)).map((item) => item.id);
  }, [observedVisibleIds, posts]);

  const subscriptionCandidates = useMemo(() => {
    if (viewingPost && currentPostData?.id) {
      return [currentPostData.id];
    }

    if (
      currentPage === "home" ||
      currentPage.startsWith("subsection-") ||
      currentPage.startsWith("topic-")
    ) {
      return sortedVisibleIds;
    }

    return [];
  }, [currentPage, currentPostData, sortedVisibleIds, viewingPost]);

  const resolveNextCounters = useCallback(
    (postId: string, metrics: PostCountersPatch): PostCountersState => {
      const previousCounters = countersRef.current[postId];
      const fallbackSummary =
        postsRef.current.find((item) => item.id === postId) ??
        (currentPostRef.current && currentPostRef.current.id === postId
          ? currentPostRef.current
          : null);

      const base: PostCountersState = previousCounters ?? {
        likes: fallbackSummary?.likes ?? 0,
        dislikes: fallbackSummary?.dislikes ?? 0,
        comments: fallbackSummary?.comments ?? 0,
        views: fallbackSummary?.views ?? 0,
      };

      const nextValue = (value?: number, fallback?: number) =>
        typeof value === "number" && Number.isFinite(value) ? value : fallback ?? 0;

      return {
        likes: nextValue(metrics.likes, base.likes),
        dislikes: nextValue(metrics.dislikes, base.dislikes),
        comments: nextValue(metrics.comments, base.comments),
        views: nextValue(metrics.views, base.views),
      };
    },
    [],
  );

  const applyPersonalStateUpdates = useCallback(
    (updates: PostMyState[] | PostMyState | undefined) => {
      const items = Array.isArray(updates)
        ? updates.filter((item): item is PostMyState => Boolean(item))
        : updates
          ? [updates]
          : [];

      if (items.length === 0) {
        return;
      }

      const patches = new Map<string, PostPersonalState>();

      for (const item of items) {
        const identifier =
          typeof item.id === "string" && item.id.trim() !== ""
            ? item.id.trim()
            : typeof item.postId === "string" && item.postId.trim() !== ""
              ? item.postId.trim()
              : undefined;

        if (!identifier) {
          continue;
        }

        const reaction = normalizeReaction(item.myReaction ?? item.reaction, item.liked, item.disliked);
        const viewed = normalizeViewed(item.viewed, item.hasViewed);

        if (reaction === undefined && viewed === undefined) {
          continue;
        }

        const existing = patches.get(identifier) ?? {};
        const nextPatch: PostPersonalState = { ...existing };

        if (reaction !== undefined) {
          nextPatch.reaction = reaction;
        }

        if (viewed !== undefined) {
          nextPatch.viewed = viewed;
        }

        patches.set(identifier, nextPatch);
      }

      if (patches.size === 0) {
        return;
      }

      patches.forEach((patch, postId) => {
        if (patch.viewed) {
          markViewRecorded(postId);
        }
      });

      setPersonalStateById((previous) => {
        let next = previous;
        let changed = false;

        patches.forEach((patch, postId) => {
          const current = previous[postId];
          const nextState: PostPersonalState = {
            reaction: patch.reaction !== undefined ? patch.reaction : current?.reaction,
            viewed: patch.viewed !== undefined ? patch.viewed : current?.viewed,
          };

          if (
            !current ||
            current.reaction !== nextState.reaction ||
            current.viewed !== nextState.viewed
          ) {
            if (!changed) {
              next = { ...previous };
              changed = true;
            }

            next[postId] = nextState;
          }
        });

        return changed ? next : previous;
      });

      setPosts((previousPosts) => {
        let changed = false;

        const updated = previousPosts.map((item) => {
          const patch = patches.get(item.id);

          if (!patch) {
            return item;
          }

          const nextReaction =
            patch.reaction !== undefined ? patch.reaction : item.myReaction;
          const nextViewed = patch.viewed !== undefined ? patch.viewed : item.hasViewed;

          if (nextReaction === item.myReaction && nextViewed === item.hasViewed) {
            return item;
          }

          changed = true;

          return {
            ...item,
            myReaction: nextReaction ?? null,
            hasViewed: nextViewed ?? false,
          } satisfies PostSummary;
        });

        return changed ? updated : previousPosts;
      });

      setCurrentPostData((previous) => {
        if (!previous) {
          return previous;
        }

        const patch = patches.get(previous.id);

        if (!patch) {
          return previous;
        }

        const nextReaction =
          patch.reaction !== undefined ? patch.reaction : previous.myReaction;
        const nextViewed =
          patch.viewed !== undefined ? patch.viewed : previous.hasViewed;

        if (nextReaction === previous.myReaction && nextViewed === previous.hasViewed) {
          return previous;
        }

        return {
          ...previous,
          myReaction: nextReaction ?? null,
          hasViewed: nextViewed ?? false,
        } satisfies PostSummary;
      });
    },
    [],
  );

  const fetchPosts = useCallback(
    async ({ signal }: { signal?: AbortSignal } = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const aggregated: PostResponse[] = [];
        let nextPage = 1;
        let expectedTotal = Number.POSITIVE_INFINITY;

        while (aggregated.length < expectedTotal) {
          if (signal?.aborted) {
            return;
          }

          const response = await fetchAllPosts({ page: nextPage, size: POSTS_PAGE_SIZE, signal });

          if (signal?.aborted) {
            return;
          }

          const items = Array.isArray(response.items) ? response.items : [];
          const pageSize = typeof response.size === "number" && response.size > 0 ? response.size : POSTS_PAGE_SIZE;

          if (items.length === 0) {
            break;
          }

          aggregated.push(...items);
          expectedTotal = typeof response.total === "number" && response.total >= 0 ? response.total : aggregated.length;

          if (aggregated.length >= expectedTotal || items.length < pageSize) {
            break;
          }

          nextPage += 1;
        }

        if (signal?.aborted) {
          return;
        }

        const normalizedPosts = aggregated.map((item) => {
          const summary = mapPostResponseToSummary(item);
          const personal = personalStateRef.current[summary.id];

          if (!personal) {
            return summary;
          }

          return {
            ...summary,
            myReaction: personal.reaction ?? null,
            hasViewed: Boolean(personal.viewed),
          } satisfies PostSummary;
        });
        normalizedPosts.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

        setPosts(normalizedPosts);
        setCountersById((previous) => {
          let next = previous;
          let changed = false;

          for (const item of normalizedPosts) {
            const counters: PostCountersState = {
              likes:
                typeof item.likes === "number" && Number.isFinite(item.likes) ? item.likes : 0,
              dislikes:
                typeof item.dislikes === "number" && Number.isFinite(item.dislikes) ? item.dislikes : 0,
              comments:
                typeof item.comments === "number" && Number.isFinite(item.comments) ? item.comments : 0,
              views:
                typeof item.views === "number" && Number.isFinite(item.views) ? item.views : 0,
            };

            const current = previous[item.id];

            if (
              !current ||
              current.likes !== counters.likes ||
              current.dislikes !== counters.dislikes ||
              current.comments !== counters.comments ||
              current.views !== counters.views
            ) {
              if (!changed) {
                next = { ...previous };
                changed = true;
              }

              next[item.id] = counters;
            }
          }

          return changed ? next : previous;
        });
        setCurrentPostData((previous) => {
          if (!previous) {
            return previous;
          }

          const updated = normalizedPosts.find((item) => item.id === previous.id);

          if (!updated) {
            return previous;
          }

          return {
            ...previous,
            ...updated,
            raw: updated.raw ?? previous.raw,
          };
        });
      } catch (caughtError: unknown) {
        if (signal?.aborted) {
          return;
        }

        if (caughtError instanceof Error && caughtError.name === "AbortError") {
          return;
        }

        const message =
          caughtError instanceof Error && caughtError.message
            ? caughtError.message
            : "Не удалось получить список публикаций";

        setError(message);
      } finally {
        if (signal?.aborted) {
          return;
        }

        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (subscriptionCandidates.length === 0) {
      setDebouncedVisibleIds((previous) => (previous.length === 0 ? previous : []));
      return;
    }

    const uniqueIds = Array.from(new Set(subscriptionCandidates));

    const updateState = () => {
      setDebouncedVisibleIds((previous) => {
        if (
          previous.length === uniqueIds.length &&
          previous.every((value, index) => value === uniqueIds[index])
        ) {
          return previous;
        }

        return uniqueIds;
      });
    };

    if (typeof window === "undefined") {
      updateState();
      return;
    }

    const timeoutId = window.setTimeout(updateState, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [subscriptionCandidates]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchPosts({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [fetchPosts]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Reset viewingPost when page changes
  useEffect(() => {
    const hasPostInLocation =
      typeof window !== "undefined" && Boolean(extractPostIdFromLocation(window.location));

    if (!initialRouteHandledRef.current) {
      initialRouteHandledRef.current = true;

      if (hasPostInLocation) {
        return;
      }
    }

    standalonePostControllerRef.current?.abort();
    setIsStandalonePostLoading(false);
    setStandalonePostError(null);
    setViewingPost(false);
    setCurrentPostData(null);
  }, [currentPage]);

  const handleViewPost = useCallback(
    (postData?: PostSummary) => {
      if (!postData) {
        return;
      }

      openPost(postData);
    },
    [openPost],
  );

  const handleBackFromPost = useCallback(() => {
    standalonePostControllerRef.current?.abort();
    setIsStandalonePostLoading(false);
    setStandalonePostError(null);
    setViewingPost(false);
    setCurrentPostData(null);

    if (typeof window !== "undefined") {
      if (window.history.state?.postId && window.history.length > 1) {
        window.history.back();
      } else {
        navigateToBase({ replace: true });
      }
    }
  }, [navigateToBase]);

  const handleRetry = () => {
    if (!isLoading) {
      fetchPosts();
    }
  };

  const handleRetrySubsection = useCallback(
    (subsection: string) => {
      void loadSubsectionPosts(subsection, { force: true });
    },
    [loadSubsectionPosts],
  );

  const handleRetryTopic = useCallback(
    (topic: string) => {
      void loadTopicPosts(topic, { force: true });
    },
    [loadTopicPosts],
  );

  const handlePostMetricsUpdate = useCallback(
    (postId: string, metrics: PostCountersPatch) => {
      if (
        !postId ||
        (metrics.likes === undefined &&
          metrics.dislikes === undefined &&
          metrics.views === undefined &&
          metrics.comments === undefined)
      ) {
        return;
      }

      const nextCounters = resolveNextCounters(postId, metrics);

      setCountersById((previous) => {
        const current = previous[postId];

        if (
          current &&
          current.likes === nextCounters.likes &&
          current.dislikes === nextCounters.dislikes &&
          current.comments === nextCounters.comments &&
          current.views === nextCounters.views
        ) {
          return previous;
        }

        return {
          ...previous,
          [postId]: nextCounters,
        };
      });

      setPosts((previousPosts) => {
        let changed = false;

        const updated = previousPosts.map((item) => {
          if (item.id !== postId) {
            return item;
          }

          const isUnchanged =
            item.likes === nextCounters.likes &&
            item.dislikes === nextCounters.dislikes &&
            item.comments === nextCounters.comments &&
            item.views === nextCounters.views &&
            (!item.raw ||
              (item.raw.likeCount === nextCounters.likes &&
                item.raw.dislikeCount === nextCounters.dislikes &&
                item.raw.commentCount === nextCounters.comments &&
                item.raw.viewCount === nextCounters.views));

          if (isUnchanged) {
            return item;
          }

          changed = true;

          const updatedRaw = item.raw
            ? {
                ...item.raw,
                likeCount: nextCounters.likes,
                dislikeCount: nextCounters.dislikes,
                commentCount: nextCounters.comments,
                viewCount: nextCounters.views,
              }
            : item.raw;

          return {
            ...item,
            likes: nextCounters.likes,
            dislikes: nextCounters.dislikes,
            comments: nextCounters.comments,
            views: nextCounters.views,
            raw: updatedRaw,
          };
        });

        return changed ? updated : previousPosts;
      });

      setCurrentPostData((previous) => {
        if (!previous || previous.id !== postId) {
          return previous;
        }

        const isUnchanged =
          previous.likes === nextCounters.likes &&
          previous.dislikes === nextCounters.dislikes &&
          previous.comments === nextCounters.comments &&
          previous.views === nextCounters.views &&
          (!previous.raw ||
            (previous.raw.likeCount === nextCounters.likes &&
              previous.raw.dislikeCount === nextCounters.dislikes &&
              previous.raw.commentCount === nextCounters.comments &&
              previous.raw.viewCount === nextCounters.views));

        if (isUnchanged) {
          return previous;
        }

        const updatedRaw = previous.raw
          ? {
              ...previous.raw,
              likeCount: nextCounters.likes,
              dislikeCount: nextCounters.dislikes,
              commentCount: nextCounters.comments,
              viewCount: nextCounters.views,
            }
          : previous.raw;

        return {
          ...previous,
          likes: nextCounters.likes,
          dislikes: nextCounters.dislikes,
          comments: nextCounters.comments,
          views: nextCounters.views,
          raw: updatedRaw,
        };
      });
    },
    [resolveNextCounters]
  );

  const handlePostPersonalStateUpdate = useCallback(
    (postId: string, patch: PostPersonalState) => {
      if (
        !postId ||
        !patch ||
        (patch.reaction === undefined && patch.viewed === undefined)
      ) {
        return;
      }

      const payload: PostMyState = { id: postId, postId };

      if (patch.reaction !== undefined) {
        payload.myReaction = patch.reaction;
      }

      if (patch.viewed !== undefined) {
        payload.viewed = patch.viewed;
        payload.hasViewed = patch.viewed;
      }

      applyPersonalStateUpdates(payload);
    },
    [applyPersonalStateUpdates],
  );

  const renderPostView = () => {
    if (!viewingPost) {
      return null;
    }

    if (isStandalonePostLoading) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Загрузка публикации...</p>
        </div>
      );
    }

    if (standalonePostError) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
          <p className="text-muted-foreground">{standalonePostError}</p>
          <Button variant="outline" size="sm" onClick={handleBackFromPost}>
            Вернуться назад
          </Button>
        </div>
      );
    }

    if (!currentPostData) {
      return null;
    }

    return (
      <PostPage
        onBack={handleBackFromPost}
        postData={currentPostData}
        onPostUpdate={handlePostMetricsUpdate}
        onPersonalStateUpdate={handlePostPersonalStateUpdate}
      />
    );
  };

  const flushPendingUpdates = useCallback(() => {
    if (pendingCountersRef.current.size === 0) {
      return;
    }

    const batched = Array.from(pendingCountersRef.current.entries());
    pendingCountersRef.current.clear();

    for (const [postId, patch] of batched) {
      const nextCounters = resolveNextCounters(postId, patch);
      const previousCounters = countersRef.current[postId];

      console.debug("[counters] applying update", {
        postId,
        previous: previousCounters,
        next: nextCounters,
      });

      handlePostMetricsUpdate(postId, patch);
    }
  }, [handlePostMetricsUpdate, resolveNextCounters]);

  const scheduleFlush = useCallback(() => {
    if (typeof window === "undefined") {
      flushPendingUpdates();
      return;
    }

    if (flushFrameRef.current !== null) {
      return;
    }

    flushFrameRef.current = window.requestAnimationFrame(() => {
      flushFrameRef.current = null;
      flushPendingUpdates();
    });
  }, [flushPendingUpdates]);

  const applyCountersUpdates = useCallback(
    (payload?: PostCountersUpdate[] | PostCountersUpdate | null) => {
      if (!payload) {
        return;
      }

      const updates = Array.isArray(payload) ? payload : [payload];
      let hasNewData = false;

      for (const update of updates) {
        if (!update) {
          continue;
        }

        const postId =
          typeof update.id === "string" && update.id.trim() !== ""
            ? update.id.trim()
            : typeof update.postId === "string" && update.postId.trim() !== ""
              ? update.postId.trim()
              : undefined;

        if (!postId) {
          continue;
        }

        const patch: PostCountersPatch = {};

        if (typeof update.likeCount === "number" && Number.isFinite(update.likeCount)) {
          patch.likes = update.likeCount;
        }

        if (typeof update.dislikeCount === "number" && Number.isFinite(update.dislikeCount)) {
          patch.dislikes = update.dislikeCount;
        }

        if (typeof update.viewCount === "number" && Number.isFinite(update.viewCount)) {
          patch.views = update.viewCount;
        }

        if (typeof update.commentCount === "number" && Number.isFinite(update.commentCount)) {
          patch.comments = update.commentCount;
        }

        if (
          patch.likes === undefined &&
          patch.dislikes === undefined &&
          patch.views === undefined &&
          patch.comments === undefined
        ) {
          continue;
        }

        const existingPatch = pendingCountersRef.current.get(postId);
        pendingCountersRef.current.set(postId, {
          ...existingPatch,
          ...patch,
        });

        hasNewData = true;
      }

      if (!hasNewData) {
        return;
      }

      scheduleFlush();
    },
    [scheduleFlush]
  );

  useEffect(() => {
    if (debouncedVisibleIds.length === 0 || typeof window === "undefined") {
      return;
    }

    const ids = Array.from(
      new Set(
        debouncedVisibleIds.filter((id) => typeof id === "string" && id.trim() !== ""),
      ),
    );

    if (ids.length === 0) {
      return;
    }

    let cancelled = false;
    let eventSource: EventSource | null = null;
    let messageHandler: ((this: EventSource, event: MessageEvent<string>) => void) | null = null;
    let reconnectTimeout: number | null = null;
    let attempt = 0;
    const controller = new AbortController();

    const cleanupEventSource = () => {
      if (eventSource) {
        if (messageHandler) {
          eventSource.removeEventListener("message", messageHandler);
          eventSource.removeEventListener("counters", messageHandler);
        }

        eventSource.close();
        eventSource = null;
        messageHandler = null;
      }
    };

    const clearReconnectTimeout = () => {
      if (reconnectTimeout !== null) {
        window.clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    function scheduleReconnect() {
      if (cancelled) {
        return;
      }

      const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
      attempt = Math.min(attempt + 1, RECONNECT_DELAYS.length - 1);

      clearReconnectTimeout();

      reconnectTimeout = window.setTimeout(() => {
        if (!cancelled) {
          void startStream();
        }
      }, delay);
    }

    async function startStream() {
      clearReconnectTimeout();
      cleanupEventSource();

      try {
        const snapshot = await fetchPostCounters(ids, controller.signal);

        if (!cancelled && !controller.signal.aborted) {
          applyCountersUpdates(snapshot);
        }
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          console.warn("Не удалось получить счётчики публикаций", error);
        }
      }

      if (cancelled || controller.signal.aborted) {
        return;
      }

      try {
        const personalSnapshot = await fetchPostMyState(ids, controller.signal);

        if (!cancelled && !controller.signal.aborted) {
          applyPersonalStateUpdates(personalSnapshot);
        }
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          console.warn("Не удалось получить пользовательское состояние публикаций", error);
        }
      }

      if (cancelled || controller.signal.aborted) {
        return;
      }

      try {
        eventSource = createPostCountersEventSource(ids);
      } catch (error) {
        console.warn("Не удалось открыть подписку на счётчики", error);
        scheduleReconnect();
        return;
      }

      attempt = 0;

      eventSource.onopen = () => {
        attempt = 0;
        clearReconnectTimeout();
      };

      messageHandler = function (this: EventSource, event: MessageEvent<string>) {
        if (cancelled) {
          return;
        }

        if (typeof event.data !== "string" || event.data.trim() === "") {
          return;
        }

        try {
          const parsed = JSON.parse(event.data) as PostCountersUpdate[] | PostCountersUpdate;
          applyCountersUpdates(parsed);
        } catch (error) {
          console.warn("Не удалось обработать обновление счётчиков", error);
        }
      };

      eventSource.addEventListener("message", messageHandler);
      eventSource.addEventListener("counters", messageHandler);

      eventSource.onerror = () => {
        if (cancelled) {
          return;
        }

        cleanupEventSource();
        scheduleReconnect();
      };
    }

    void startStream();

    return () => {
      cancelled = true;
      controller.abort();
      cleanupEventSource();
      clearReconnectTimeout();
    };
  }, [applyCountersUpdates, applyPersonalStateUpdates, debouncedVisibleIds]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <TopHeader onPageChange={setCurrentPage} />
      <MobileMenu currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <div className="mt-[104px] lg:mt-14">
        <main className="mx-auto lg:py-8 py-2">
          <div 
  className="grid grid-cols-1 gap-5 mx-auto px-4 sm:px-6"
  style={{
    maxWidth: '1440px',
    gridTemplateColumns: window.innerWidth >= 1024 ? '240px 1fr 340px' : '1fr',
    gap: window.innerWidth >= 1024 ? '2.5rem' : '1.25rem'
  }}
>
            {/* Left Sidebar - Navigation */}
            <div className="hidden lg:block pt-6">
              <LeftSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            {/* Main Content */}
            <div className="min-h-[calc(100vh-10rem)]">
              {currentPage === "home" && renderPostView()}

             
              {!viewingPost && currentPage === "home" && (
                <div className="space-y-3 sm:space-y-5 lg:pt-6 pt-1">
                  {isLoading && posts.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                      <p className="text-muted-foreground">Загрузка публикаций...</p>
                    </div>
                  )}

                  {error && posts.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
                      <p className="text-muted-foreground">{error}</p>
                      <Button variant="outline" size="sm" onClick={handleRetry}>
                        Повторить попытку
                      </Button>
                    </div>
                  )}

                  {!isLoading && !error && posts.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                      <p className="text-muted-foreground">Публикации ещё не добавлены. Загляните позже!</p>
                    </div>
                  )}

                  {posts.length > 0 && (
                    <>
                      <div className="space-y-3 sm:space-y-5">
                        {posts.map((item) => {
                          const personal = personalStateById[item.id];
                          const reaction =
                            personal && personal.reaction !== undefined
                              ? personal.reaction
                              : item.myReaction ?? null;
                          const viewed =
                            personal && personal.viewed !== undefined
                              ? personal.viewed
                              : item.hasViewed ?? false;

                          return (
                            <NewsCard
                              key={item.id}
                              {...item}
                              likes={countersById[item.id]?.likes ?? item.likes}
                              dislikes={countersById[item.id]?.dislikes ?? item.dislikes}
                              comments={countersById[item.id]?.comments ?? item.comments}
                              views={countersById[item.id]?.views ?? item.views}
                              myReaction={reaction}
                              hasViewed={viewed}
                              onViewPost={() => handleViewPost(item)}
                              onPostUpdate={handlePostMetricsUpdate}
                              onPersonalStateUpdate={handlePostPersonalStateUpdate}
                              visibilityObserver={registerPostVisibility}
                            />
                          );
                        })}
                      </div>

                      {/* Infinite scroll indicator */}
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">Загрузка новых публикаций...</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {currentPage === "exhibitions" && <ExhibitionsPage />}

              {currentPage === "translators" && (
                <TranslatorsPage onSidebarFiltersChange={setTranslatorsSidebarFilters} />
              )}

              {currentPage === "about" && <AboutPage />}

              {currentPage === "contacts" && <ContactsPage />}

              {currentPage.startsWith("subsection-") && !viewingPost && (() => {
                const rawSectionTitle = currentPage.replace("subsection-", "");
                const subsectionKey = rawSectionTitle.trim();
                const sectionState = subsectionStates[subsectionKey];
                const fallbackPosts = posts.filter((item) => item.category === subsectionKey);
                const sectionPosts =
                  sectionState?.items && sectionState.items.length > 0
                    ? sectionState.items
                    : fallbackPosts;

                if (sectionState?.isLoading && sectionPosts.length === 0) {
                  return (
                    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
                      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                        <p className="text-muted-foreground">Загрузка публикаций...</p>
                      </div>
                    </div>
                  );
                }

                if (sectionState?.error && !sectionState.isLoading && sectionPosts.length === 0) {
                  return (
                    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
                      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
                        <p className="text-muted-foreground">{sectionState.error}</p>
                        <Button variant="outline" size="sm" onClick={() => handleRetrySubsection(subsectionKey)}>
                          Повторить попытку
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <SubsectionPage
                    title={rawSectionTitle}
                    description={getSubsectionDescription(rawSectionTitle)}
                    posts={sectionPosts}
                    countersById={countersById}
                    onViewPost={handleViewPost}
                    onPostUpdate={handlePostMetricsUpdate}
                    onPersonalStateUpdate={handlePostPersonalStateUpdate}
                    registerVisibility={registerPostVisibility}
                  />
                );
              })()}
              
              {currentPage.startsWith("subsection-") && renderPostView()}

              {currentPage === "events" && <EventsPage highlightEventId={highlightedEventId} />}

              {currentPage === "upcoming-events" && <UpcomingEventsPage onPageChange={setCurrentPage} />}

              {currentPage.startsWith("topic-") && !viewingPost && (() => {
                const rawTopicKey = currentPage.replace("topic-", "");
                const topicKey = rawTopicKey.trim();
                const topicState = topicStates[topicKey];
                const topicPosts =
                  topicState?.items && topicState.items.length > 0 ? topicState.items : posts;

                if (topicState?.isLoading && topicPosts.length === 0) {
                  return (
                    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
                      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                        <p className="text-muted-foreground">Загрузка публикаций...</p>
                      </div>
                    </div>
                  );
                }

                if (topicState?.error && !topicState.isLoading && topicPosts.length === 0) {
                  return (
                    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
                      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
                        <p className="text-muted-foreground">{topicState.error}</p>
                        <Button variant="outline" size="sm" onClick={() => handleRetryTopic(topicKey)}>
                          Повторить попытку
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <TopicPage
                    topic={topicKey}
                    posts={topicPosts}
                    countersById={countersById}
                    onViewPost={handleViewPost}
                    onPostUpdate={handlePostMetricsUpdate}
                    onPersonalStateUpdate={handlePostPersonalStateUpdate}
                    registerVisibility={registerPostVisibility}
                  />
                );
              })()}
              {currentPage.startsWith("topic-") && renderPostView()}
            </div>

            {/* Right Sidebar - Scrolls with page */}
            <div className="hidden lg:block">
              <RightSidebar 
                onPageChange={setCurrentPage} 
                currentPage={currentPage}
                filterContent={
                  currentPage === "translators"
                    ? translatorsSidebarFilters ?? undefined
                    : currentPage === "exhibitions" ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <h3 className="text-sm mb-4">Фильтры</h3>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Поиск</label>
                        <input
                          type="text"
                          placeholder="Название события..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Регион</label>
                        <select size={5} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <option>Все регионы</option>
                          <option>Алматы</option>
                          <option>Астана</option>
                          <option>Шымкент</option>
                          <option>Караганда</option>
                          <option>Актобе</option>
                          <option>Тараз</option>
                          <option>Павлодар</option>
                          <option>Костанай</option>
                          <option>Кызылорда</option>
                          <option>Атырау</option>
                          <option>Актау</option>
                          <option>Усть-Каменогорск</option>
                          <option>Семей</option>
                          <option>Петропавловск</option>
                          <option>Талдыкорган</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Сфера</label>
                        <select size={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <option>Все сферы</option>
                          <option>Технологии</option>
                          <option>Бизнес</option>
                          <option>Искусство</option>
                          <option>Наука</option>
                          <option>Образование</option>
                          <option>Медицина</option>
                          <option>Финансы</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Статус</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          <option>Все</option>
                          <option>Предстоящие</option>
                          <option>Завершенные</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Формат</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          <option>Любой</option>
                          <option>Онлайн</option>
                          <option>Офлайн</option>
                          <option>Гибрид</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Даты проведения</label>
                        <div className="space-y-2">
                          <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                          <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Применить
                      </button>
                    </div>
                  ) : undefined
                }
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-16 bg-white">
<div className="mx-auto px-4 sm:px-6 py-8" style={{ maxWidth: '1440px' }}>
            <div className="text-center text-sm text-muted-foreground">
              <p>© 2025 OrientVentus. Все права защищены.</p>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
