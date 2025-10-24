import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Eye,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  Tag,
  X,
} from "lucide-react";

import { searchContent, resolveFileUrl } from "../lib/api";
import { formatRelativeTime } from "../lib/dates";
import type {
  SearchKind,
  SearchResponse,
  SearchResultEvent,
  SearchResultItem,
  SearchResultPost,
  SearchResultTopic,
} from "../types/search";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const PAGE_SIZE = 10;
const SUGGESTED_QUERIES = [
  "Искусственный интеллект",
  "Молодёжные события",
  "Образование",
  "Стартап",
  "Волонтёрство",
];

type TabKey = "all" | "post" | "event";

interface SearchPanelProps {
  open: boolean;
  onClose?: () => void;
}

interface SearchState {
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  size: number;
  items: SearchResultItem[];
  receivedQuery: string;
}

const TAB_KINDS: Record<TabKey, SearchKind[] | undefined> = {
  all: undefined,
  post: ["POST"],
  event: ["EVENT"],
};

function createInitialState(): SearchState {
  return {
    isLoading: false,
    error: null,
    total: 0,
    page: 1,
    size: PAGE_SIZE,
    items: [],
    receivedQuery: "",
  };
}

function isPost(item: SearchResultItem): item is SearchResultPost {
  return item.kind === "POST";
}

function isEvent(item: SearchResultItem): item is SearchResultEvent {
  return item.kind === "EVENT";
}

function isTopic(item: SearchResultItem): item is SearchResultTopic {
  return item.kind === "TOPIC";
}

function formatAbsoluteDate(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPostDate(value?: string | null): string {
  if (!value) {
    return "";
  }

  const relative = formatRelativeTime(value);

  if (relative) {
    return relative;
  }

  return formatAbsoluteDate(value);
}

function buildSnippet(snippet?: string | null): { __html: string } | undefined {
  if (!snippet) {
    return undefined;
  }

  return { __html: snippet };
}

function resolveThumbnail(url?: string | null): string | undefined {
  if (!url) {
    return undefined;
  }

  return resolveFileUrl(url) ?? undefined;
}

export function SearchPanel({ open, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [pageByTab, setPageByTab] = useState<Record<TabKey, number>>({
    all: 1,
    post: 1,
    event: 1,
  });
  const [states, setStates] = useState<Record<TabKey, SearchState>>({
    all: createInitialState(),
    post: createInitialState(),
    event: createInitialState(),
  });

  const currentPage = pageByTab[activeTab];

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebouncedQuery("");
      setActiveTab("all");
      setPageByTab({ all: 1, post: 1, event: 1 });
      setStates({
        all: createInitialState(),
        post: createInitialState(),
        event: createInitialState(),
      });
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    const handle = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 350);

    return () => {
      window.clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    setPageByTab({ all: 1, post: 1, event: 1 });
  }, [debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setStates({
        all: createInitialState(),
        post: createInitialState(),
        event: createInitialState(),
      });
      return;
    }

    if (!open) {
      return;
    }

    const tab = activeTab;
    const kinds = TAB_KINDS[tab];
    const page = currentPage;
    const controller = new AbortController();
    const requestQuery = debouncedQuery;

    setStates((previous) => ({
      ...previous,
      [tab]: {
        ...previous[tab],
        isLoading: true,
        error: null,
        receivedQuery: requestQuery,
      },
    }));

    searchContent({
      query: requestQuery,
      page,
      size: PAGE_SIZE,
      kinds,
      signal: controller.signal,
    })
      .then((response: SearchResponse) => {
        setStates((previous) => ({
          ...previous,
          [tab]: {
            ...previous[tab],
            isLoading: false,
            error: null,
            total: typeof response.total === "number" ? response.total : 0,
            page: typeof response.page === "number" ? response.page : page,
            size: typeof response.size === "number" ? response.size : PAGE_SIZE,
            items: Array.isArray(response.items) ? response.items : [],
            receivedQuery: requestQuery,
          },
        }));

        setPageByTab((previous) => ({
          ...previous,
          [tab]: typeof response.page === "number" ? response.page : page,
        }));
      })
      .catch((error) => {
        if (error?.name === "AbortError") {
          return;
        }

        setStates((previous) => ({
          ...previous,
          [tab]: {
            ...previous[tab],
            isLoading: false,
            error:
              error instanceof Error
                ? error.message || "Не удалось выполнить поиск"
                : "Не удалось выполнить поиск",
            total: 0,
            items: [],
            receivedQuery: requestQuery,
          },
        }));
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, activeTab, currentPage, open]);

  const activeState = states[activeTab];
  const totalPages = useMemo(() => {
    if (!activeState || activeState.size <= 0) {
      return 1;
    }

    const pages = Math.ceil(activeState.total / activeState.size);
    return Number.isFinite(pages) && pages > 0 ? pages : 1;
  }, [activeState]);

  const handlePageChange = (tab: TabKey, nextPage: number) => {
    setPageByTab((previous) => ({
      ...previous,
      [tab]: Math.max(1, nextPage),
    }));
  };

  const renderPost = (item: SearchResultPost) => {
    const thumbnail = resolveThumbnail(item.thumbnail);
    const createdAt = formatPostDate(item.createdAt);
    const views = typeof item.viewCount === "number" ? item.viewCount : 0;
    const likes = typeof item.likeCount === "number" ? item.likeCount : 0;
    const comments = typeof item.commentCount === "number" ? item.commentCount : 0;

    return (
      <div
        key={item.id ?? `${item.title ?? "post"}-${createdAt}`}
        className="flex gap-3 rounded-lg border border-border bg-background p-3 hover:bg-muted/40"
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="h-20 w-20 flex-shrink-0 rounded-md bg-muted/60" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {item.chapter && <span className="font-medium uppercase">{item.chapter}</span>}
            {item.topic && (
              <span className="inline-flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {item.topic}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-foreground">
              {item.title || "Без названия"}
            </p>
            {item.snippet && (
              <p
                className="mt-1 line-clamp-3 text-sm text-muted-foreground"
                dangerouslySetInnerHTML={buildSnippet(item.snippet)}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {createdAt && <span>Обновлено {createdAt}</span>}
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {views}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {likes}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> {comments}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderEvent = (item: SearchResultEvent) => {
    const cover = resolveThumbnail(item.coverUrl);
    const date = formatAbsoluteDate(item.eventDate);
    const createdAt = formatPostDate(item.createdAt);

    return (
      <div
        key={item.id ?? `${item.title ?? "event"}-${date}`}
        className="flex gap-3 rounded-lg border border-border bg-background p-3 hover:bg-muted/40"
      >
        {cover ? (
          <img src={cover} alt="" className="h-20 w-20 flex-shrink-0 rounded-md object-cover" />
        ) : (
          <div className="h-20 w-20 flex-shrink-0 rounded-md bg-muted/60" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {item.sphere && <span className="font-medium uppercase">{item.sphere}</span>}
            {item.region && <span className="rounded-full bg-muted px-2 py-0.5">{item.region}</span>}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-foreground">
              {item.title || "Без названия"}
            </p>
            {item.snippet && (
              <p
                className="mt-1 line-clamp-3 text-sm text-muted-foreground"
                dangerouslySetInnerHTML={buildSnippet(item.snippet)}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {date && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {date}
              </span>
            )}
            {item.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {item.location}
              </span>
            )}
            {createdAt && <span>Добавлено {createdAt}</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderTopics = (topics: SearchResultTopic[]) => {
    if (!topics.length) {
      return null;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Темы (совпадения)</h4>
          <span className="text-xs text-muted-foreground">{topics.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => {
            const key = topic.id ?? topic.topic;
            return (
              <button
                key={key}
                type="button"
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                onClick={() => {
                  setQuery(topic.topic);
                  setDebouncedQuery(topic.topic.trim());
                }}
              >
                <span>{topic.topic}</span>
                <Badge variant="secondary" className="group-hover:border-primary/40 group-hover:bg-primary/10">
                  {topic.postCount}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderResults = (tab: TabKey) => {
    const state = states[tab];

    if (!debouncedQuery) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <Search className="h-10 w-10" />
          <div>
            <p className="text-sm font-medium">Начните вводить запрос</p>
            <p className="text-xs">Мы найдём публикации, события и подходящие темы</p>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {SUGGESTED_QUERIES.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium transition hover:border-primary hover:text-primary"
                onClick={() => {
                  setQuery(suggestion);
                  setDebouncedQuery(suggestion.trim());
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (state.isLoading) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Ищем «{state.receivedQuery}»…</span>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <p className="text-sm font-medium">Не удалось выполнить поиск</p>
          <p className="text-xs">{state.error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPageByTab((previous) => ({ ...previous }));
            }}
          >
            Повторить попытку
          </Button>
        </div>
      );
    }

    const items = Array.isArray(state.items) ? state.items : [];
    const posts = items.filter(isPost);
    const events = items.filter(isEvent);
    const topics = tab === "all" ? items.filter(isTopic) : [];

    if (!posts.length && !events.length && !topics.length) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <p className="text-sm font-medium">Ничего не найдено</p>
          <p className="text-xs">Попробуйте изменить формулировку или использовать другое слово</p>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Найдено {state.total}</span>
          <span>
            Страница {state.page} из {Math.max(1, Math.ceil(Math.max(state.total, 1) / state.size || 1))}
          </span>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {topics.length > 0 && renderTopics(topics)}
          {posts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Публикации</h4>
              {posts.map(renderPost)}
            </div>
          )}
          {events.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">События</h4>
              {events.map(renderEvent)}
            </div>
          )}
        </div>
        {state.total > state.size && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <span>
              Показано {(state.page - 1) * state.size + 1}–
              {Math.min(state.page * state.size, state.total)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={state.page <= 1}
                onClick={() => handlePageChange(tab, state.page - 1)}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={state.page >= totalPages}
                onClick={() => handlePageChange(tab, state.page + 1)}
              >
                Далее
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-[360px] w-full flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Поиск</h3>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Закрыть поиск"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Введите запрос..."
            className="h-10 pl-10 pr-8"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                const value = event.currentTarget.value.trim();
                setDebouncedQuery(value);
              }
            }}
            autoFocus
          />
          {query && (
            <button
              type="button"
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
              }}
              aria-label="Очистить запрос"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)} className="flex-1">
        <div className="border-b border-border px-4 pt-3">
          <TabsList className="bg-transparent p-0">
            <TabsTrigger value="all" className="rounded-full px-4 py-1 text-sm">
              Все
            </TabsTrigger>
            <TabsTrigger value="post" className="rounded-full px-4 py-1 text-sm">
              Посты
            </TabsTrigger>
            <TabsTrigger value="event" className="rounded-full px-4 py-1 text-sm">
              События
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="all" className="flex-1 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto px-4 py-3">
            {renderResults("all")}
          </div>
        </TabsContent>
        <TabsContent value="post" className="flex-1 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto px-4 py-3">
            {renderResults("post")}
          </div>
        </TabsContent>
        <TabsContent value="event" className="flex-1 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto px-4 py-3">
            {renderResults("event")}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
