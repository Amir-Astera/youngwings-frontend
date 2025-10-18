import { useCallback, useEffect, useMemo, useState } from "react";
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
import { createPostCountersEventSource, fetchAllPosts, fetchPostCounters } from "./lib/api";
import { formatRelativeTime } from "./lib/dates";
import { useVisiblePosts } from "./lib/useVisiblePosts";
import type { PostCountersUpdate, PostResponse, PostSummary } from "./types/post";

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
  const image =
    rawThumbnail && !/^(нет\s+фотки?|string)$/i.test(rawThumbnail) ? rawThumbnail : undefined;
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
  };
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [viewingPost, setViewingPost] = useState(false);
  const [currentPostData, setCurrentPostData] = useState<PostSummary | null>(null);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register: registerPostVisibility, visibleIds: observedVisibleIds } = useVisiblePosts();
  const [debouncedVisibleIds, setDebouncedVisibleIds] = useState<string[]>([]);

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

        const normalizedPosts = aggregated.map((item) => mapPostResponseToSummary(item));
        normalizedPosts.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

        setPosts(normalizedPosts);
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
    setViewingPost(false);
    setCurrentPostData(null);
  }, [currentPage]);

  const handleViewPost = (postData?: PostSummary) => {
    if (!postData) {
      return;
    }

    setCurrentPostData(postData);
    setViewingPost(true);
  };

  const handleBackFromPost = () => {
    setViewingPost(false);
    setCurrentPostData(null);
  };

  const handleRetry = () => {
    if (!isLoading) {
      fetchPosts();
    }
  };

  const handlePostMetricsUpdate = useCallback(
    (
      postId: string,
      metrics: { likes?: number; dislikes?: number; views?: number; comments?: number }
    ) => {
      setPosts((previousPosts) =>
        previousPosts.map((item) => {
          if (item.id !== postId) {
            return item;
          }

          const updatedRaw = item.raw
            ? {
                ...item.raw,
                likeCount: metrics.likes ?? item.raw.likeCount,
                dislikeCount: metrics.dislikes ?? item.raw.dislikeCount,
                viewCount: metrics.views ?? item.raw.viewCount,
                commentCount: metrics.comments ?? item.raw.commentCount,
              }
            : item.raw;

          return {
            ...item,
            likes: metrics.likes ?? item.likes,
            dislikes: metrics.dislikes ?? item.dislikes,
            views: metrics.views ?? item.views,
            comments: metrics.comments ?? item.comments,
            raw: updatedRaw,
          };
        })
      );

      setCurrentPostData((previous) => {
        if (!previous || previous.id !== postId) {
          return previous;
        }

        const updatedRaw = previous.raw
          ? {
              ...previous.raw,
              likeCount: metrics.likes ?? previous.raw.likeCount,
              dislikeCount: metrics.dislikes ?? previous.raw.dislikeCount,
              viewCount: metrics.views ?? previous.raw.viewCount,
              commentCount: metrics.comments ?? previous.raw.commentCount,
            }
          : previous.raw;

        return {
          ...previous,
          likes: metrics.likes ?? previous.likes,
          dislikes: metrics.dislikes ?? previous.dislikes,
          views: metrics.views ?? previous.views,
          comments: metrics.comments ?? previous.comments,
          raw: updatedRaw,
        };
      });
    },
    []
  );

  const applyCountersUpdates = useCallback(
    (payload?: PostCountersUpdate[] | PostCountersUpdate | null) => {
      if (!payload) {
        return;
      }

      const updates = Array.isArray(payload) ? payload : [payload];

      for (const update of updates) {
        if (!update || typeof update.id !== "string") {
          continue;
        }

        handlePostMetricsUpdate(update.id, {
          likes:
            typeof update.likeCount === "number" && Number.isFinite(update.likeCount)
              ? update.likeCount
              : undefined,
          dislikes:
            typeof update.dislikeCount === "number" && Number.isFinite(update.dislikeCount)
              ? update.dislikeCount
              : undefined,
          views:
            typeof update.viewCount === "number" && Number.isFinite(update.viewCount)
              ? update.viewCount
              : undefined,
          comments:
            typeof update.commentCount === "number" && Number.isFinite(update.commentCount)
              ? update.commentCount
              : undefined,
        });
      }
    },
    [handlePostMetricsUpdate]
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
  }, [applyCountersUpdates, debouncedVisibleIds]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader />
      <MobileMenu currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <div className="mt-[104px] lg:mt-14">
        <main className="mx-auto lg:py-8 py-2">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_380px] gap-5 lg:gap-8 max-w-[1400px] mx-auto px-4 sm:px-8">
            {/* Left Sidebar - Navigation */}
            <div className="hidden lg:block pt-6">
              <LeftSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            {/* Main Content */}
            <div className="min-h-[calc(100vh-10rem)]">
              {viewingPost && currentPage === "home" && (
                <PostPage
                  onBack={handleBackFromPost}
                  postData={currentPostData}
                  onPostUpdate={handlePostMetricsUpdate}
                />
              )}
              
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
                        {posts.map((item) => (
                          <NewsCard
                            key={item.id}
                            {...item}
                            onViewPost={() => handleViewPost(item)}
                            onPostUpdate={handlePostMetricsUpdate}
                            visibilityObserver={registerPostVisibility}
                          />
                        ))}
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

              {currentPage === "translators" && <TranslatorsPage />}

              {currentPage === "about" && <AboutPage />}

              {currentPage === "contacts" && <ContactsPage />}

              {currentPage.startsWith("subsection-") && !viewingPost && (() => {
                const sectionTitle = currentPage.replace("subsection-", "");

                if (isLoading && posts.length === 0) {
                  return (
                    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
                      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                        <p className="text-muted-foreground">Загрузка публикаций...</p>
                      </div>
                    </div>
                  );
                }

                if (error && posts.length === 0) {
                  return (
                    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
                      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
                        <p className="text-muted-foreground">{error}</p>
                        <Button variant="outline" size="sm" onClick={handleRetry}>
                          Повторить попытку
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <SubsectionPage
                    title={sectionTitle}
                    description={getSubsectionDescription(sectionTitle)}
                    posts={posts.filter((item) => item.category === sectionTitle)}
                    onViewPost={handleViewPost}
                    onPostUpdate={handlePostMetricsUpdate}
                    registerVisibility={registerPostVisibility}
                  />
                );
              })()}
              
              {currentPage.startsWith("subsection-") && viewingPost && (
                <PostPage
                  onBack={handleBackFromPost}
                  postData={currentPostData}
                  onPostUpdate={handlePostMetricsUpdate}
                />
              )}

              {currentPage === "events" && <EventsPage />}

              {currentPage === "upcoming-events" && <UpcomingEventsPage onPageChange={setCurrentPage} />}

              {currentPage.startsWith("topic-") && !viewingPost && (() => {
                const topicKey = currentPage.replace("topic-", "");

                if (isLoading && posts.length === 0) {
                  return (
                    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
                      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                        <p className="text-muted-foreground">Загрузка публикаций...</p>
                      </div>
                    </div>
                  );
                }

                if (error && posts.length === 0) {
                  return (
                    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
                      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
                        <p className="text-muted-foreground">{error}</p>
                        <Button variant="outline" size="sm" onClick={handleRetry}>
                          Повторить попытку
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <TopicPage
                    topic={topicKey}
                    posts={posts}
                    onViewPost={handleViewPost}
                    onPostUpdate={handlePostMetricsUpdate}
                    registerVisibility={registerPostVisibility}
                  />
                );
              })()}
              {currentPage.startsWith("topic-") && viewingPost && (
                <PostPage
                  onBack={handleBackFromPost}
                  postData={currentPostData}
                  onPostUpdate={handlePostMetricsUpdate}
                />
              )}
            </div>

            {/* Right Sidebar - Scrolls with page */}
            <div className="hidden lg:block">
              <RightSidebar 
                onPageChange={setCurrentPage} 
                currentPage={currentPage}
                filterContent={
                  currentPage === "exhibitions" ? (
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
                  ) : currentPage === "translators" ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <h3 className="text-sm mb-4">Фильтры</h3>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Поиск</label>
                        <input
                          type="text"
                          placeholder="Имя или услуга..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Язык (с)</label>
                        <select size={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <option>Любой</option>
                          <option>Русский</option>
                          <option>Английский</option>
                          <option>Казахский</option>
                          <option>Китайский</option>
                          <option>Турецкий</option>
                          <option>Корейский</option>
                          <option>Немецкий</option>
                          <option>Французский</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Язык (на)</label>
                        <select size={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <option>Любой</option>
                          <option>Русский</option>
                          <option>Английский</option>
                          <option>Казахский</option>
                          <option>Китайский</option>
                          <option>Турецкий</option>
                          <option>Корейский</option>
                          <option>Немецкий</option>
                          <option>Французский</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Тип услуги</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          <option>Все услуги</option>
                          <option>Письменный перевод</option>
                          <option>Устный перевод</option>
                          <option>Синхронный перевод</option>
                          <option>Технический перевод</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Опыт работы</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          <option>Любой</option>
                          <option>До 1 года</option>
                          <option>1-3 года</option>
                          <option>3-5 лет</option>
                          <option>5+ лет</option>
                        </select>
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
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
            <div className="text-center text-sm text-muted-foreground">
              <p>© 2025 YoungWings. Все права защищены.</p>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
