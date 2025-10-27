import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { BadgeCheck, Calendar, Globe2, MapPin, MapPinned, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { fetchEvents } from "../lib/api";
import { formatEventDate, getEventCoverUrl, getEventFormatLabel, getEventStatusLabel } from "../lib/events";
import type { EventResponse } from "../types/event";

const PAGE_SIZE = 20;

const DEFAULT_STATUS_CODES = ["PLANNED", "ONGOING", "ACTIVE", "COMPLETED", "CANCELLED", "PUBLISHED"] as const;
const DEFAULT_FORMAT_CODES = ["ONLINE", "OFFLINE", "HYBRID"] as const;

function mergeStringLists(existing: string[], values: (string | null | undefined)[]): string[] {
  const additions = values
    .map((value) => value?.toString().trim())
    .filter((value): value is string => Boolean(value));

  if (additions.length === 0) {
    return existing;
  }

  const seen = new Set(existing.map((value) => value.toLowerCase()));
  let changed = false;
  const nextValues = [...existing];

  for (const value of additions) {
    const lower = value.toLowerCase();

    if (!seen.has(lower)) {
      seen.add(lower);
      nextValues.push(value);
      changed = true;
    }
  }

  if (!changed) {
    return existing;
  }

  return nextValues.sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));
}

function validateDateRange(start?: string, end?: string): string | null {
  if (!start || !end) {
    return null;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Введите корректные даты";
  }

  if (startDate > endDate) {
    return "Дата окончания не может быть раньше даты начала";
  }

  return null;
}

interface EventsPageProps {
  highlightEventId?: string | null;
  initialSearchQuery?: string;
  onSidebarFiltersChange?: (content: ReactNode | null) => void;
}

export function EventsPage({
  highlightEventId,
  initialSearchQuery,
  onSidebarFiltersChange,
}: EventsPageProps) {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [sphereFilter, setSphereFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [knownStatuses, setKnownStatuses] = useState<string[]>([]);
  const [knownFormats, setKnownFormats] = useState<string[]>([]);
  const [knownRegions, setKnownRegions] = useState<string[]>([]);
  const [knownSpheres, setKnownSpheres] = useState<string[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    if (typeof initialSearchQuery !== "string") {
      return;
    }

    const normalized = initialSearchQuery.trim();

    setSearchQuery((previous) => (previous === normalized ? previous : normalized));
  }, [initialSearchQuery]);

  const loadEvents = useCallback(
    async (signal?: AbortSignal) => {
      const validationError = validateDateRange(dateFrom, dateTo);

      setDateRangeError(validationError);

      if (validationError) {
        setEvents([]);
        setError(validationError);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchEvents<EventResponse>({
          page: 1,
          size: PAGE_SIZE,
          status: statusFilter || undefined,
          format: formatFilter || undefined,
          region: regionFilter || undefined,
          sphere: sphereFilter || undefined,
          title: searchQuery || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          signal,
        });

        if (signal?.aborted) {
          return;
        }

        const items = Array.isArray(response.items) ? response.items : [];

        setEvents(items);
        setKnownStatuses((prev) => mergeStringLists(prev, items.map((item) => item.status)));
        setKnownFormats((prev) => mergeStringLists(prev, items.map((item) => item.format)));
        setKnownRegions((prev) => mergeStringLists(prev, items.map((item) => item.region)));
        setKnownSpheres((prev) => mergeStringLists(prev, items.map((item) => item.sphere)));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        if (!signal?.aborted) {
          setError(err instanceof Error ? err.message : "Не удалось загрузить события");
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [dateFrom, dateTo, formatFilter, regionFilter, searchQuery, sphereFilter, statusFilter],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadEvents(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadEvents]);

  useEffect(() => {
    setDateRangeError(validateDateRange(dateFrom, dateTo));
  }, [dateFrom, dateTo]);

  const hasEvents = events.length > 0;

  const statusOptions = useMemo(() => {
    const dynamic = knownStatuses
      .filter((value) => value.trim().length > 0)
      .filter(
        (value) =>
          !DEFAULT_STATUS_CODES.some((defaultStatus) => defaultStatus.toLowerCase() === value.toLowerCase()),
      )
      .sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));

    const combined = [...DEFAULT_STATUS_CODES, ...dynamic];
    const seen = new Set<string>();

    return combined
      .filter((value) => {
        const key = value.toLowerCase();

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .map((value) => ({
        value,
        label: getEventStatusLabel(value) ?? value,
      }));
  }, [knownStatuses]);

  const formatOptions = useMemo(() => {
    const dynamic = knownFormats
      .filter((value) => value.trim().length > 0)
      .filter(
        (value) =>
          !DEFAULT_FORMAT_CODES.some((defaultFormat) => defaultFormat.toLowerCase() === value.toLowerCase()),
      )
      .sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));

    const combined = [...DEFAULT_FORMAT_CODES, ...dynamic];
    const seen = new Set<string>();

    return combined
      .filter((value) => {
        const key = value.toLowerCase();

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .map((value) => ({
        value,
        label: getEventFormatLabel(value) ?? value,
      }));
  }, [knownFormats]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        searchQuery.trim() ||
          statusFilter ||
          formatFilter ||
          regionFilter ||
          sphereFilter ||
          dateFrom ||
          dateTo,
      ),
    [dateFrom, dateTo, formatFilter, regionFilter, searchQuery, sphereFilter, statusFilter],
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (searchQuery.trim()) {
      count += 1;
    }

    if (statusFilter) {
      count += 1;
    }

    if (formatFilter) {
      count += 1;
    }

    if (regionFilter) {
      count += 1;
    }

    if (sphereFilter) {
      count += 1;
    }

    if (dateFrom) {
      count += 1;
    }

    if (dateTo) {
      count += 1;
    }

    return count;
  }, [dateFrom, dateTo, formatFilter, regionFilter, searchQuery, sphereFilter, statusFilter]);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleFormatChange = useCallback((value: string) => {
    setFormatFilter(value);
  }, []);

  const handleRegionChange = useCallback((value: string) => {
    setRegionFilter(value);
  }, []);

  const handleSphereChange = useCallback((value: string) => {
    setSphereFilter(value);
  }, []);

  const handleDateFromChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDateFrom(event.target.value);
  }, []);

  const handleDateToChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDateTo(event.target.value);
  }, []);

  const handleApplyFilters = useCallback(() => {
    const validationError = validateDateRange(dateFrom, dateTo);

    setDateRangeError(validationError);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsFilterSheetOpen(false);
    void loadEvents();
  }, [dateFrom, dateTo, loadEvents]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("");
    setFormatFilter("");
    setRegionFilter("");
    setSphereFilter("");
    setDateFrom("");
    setDateTo("");
    setDateRangeError(null);
    setError(null);
    setIsFilterSheetOpen(false);
  }, []);

  const handleDesktopFiltersSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleApplyFilters();
    },
    [handleApplyFilters],
  );

  const sidebarFilters = useMemo(() => {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <form className="space-y-5" onSubmit={handleDesktopFiltersSubmit}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Фильтры</h3>
            {activeFiltersCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                {activeFiltersCount}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="desktop-event-search">
              Поиск
            </label>
            <input
              id="desktop-event-search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Название события..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="desktop-event-status">
              Статус
            </label>
            <select
              id="desktop-event-status"
              value={statusFilter}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Все статусы</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="desktop-event-format">
              Формат
            </label>
            <select
              id="desktop-event-format"
              value={formatFilter}
              onChange={(event) => handleFormatChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Любой</option>
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="desktop-event-region">
              Регион
            </label>
            <select
              id="desktop-event-region"
              value={regionFilter}
              onChange={(event) => handleRegionChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Любой</option>
              {knownRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="desktop-event-sphere">
              Сфера
            </label>
            <select
              id="desktop-event-sphere"
              value={sphereFilter}
              onChange={(event) => handleSphereChange(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Любая</option>
              {knownSpheres.map((sphere) => (
                <option key={sphere} value={sphere}>
                  {sphere}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="desktop-event-date-from">
                Дата начала
              </label>
              <input
                id="desktop-event-date-from"
                type="date"
                value={dateFrom}
                onChange={handleDateFromChange}
                max={dateTo || undefined}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="desktop-event-date-to">
                Дата окончания
              </label>
              <input
                id="desktop-event-date-to"
                type="date"
                value={dateTo}
                onChange={handleDateToChange}
                min={dateFrom || undefined}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {dateRangeError && (
            <p className="text-xs text-destructive">{dateRangeError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={Boolean(dateRangeError)}>
              Применить
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
            >
              Сбросить
            </Button>
          </div>
        </form>
      </div>
    );
  }, [
    activeFiltersCount,
    dateFrom,
    dateRangeError,
    dateTo,
    formatFilter,
    formatOptions,
    handleDesktopFiltersSubmit,
    handleDateFromChange,
    handleDateToChange,
    handleFormatChange,
    handleRegionChange,
    handleSphereChange,
    handleResetFilters,
    handleSearchChange,
    handleStatusChange,
    hasActiveFilters,
    knownRegions,
    knownSpheres,
    searchQuery,
    sphereFilter,
    statusFilter,
    statusOptions,
  ]);

  useEffect(() => {
    onSidebarFiltersChange?.(sidebarFilters);
  }, [onSidebarFiltersChange, sidebarFilters]);

  useEffect(() => () => {
    onSidebarFiltersChange?.(null);
  }, [onSidebarFiltersChange]);

  const renderedEvents = useMemo(() => {
    const trimmedHighlight = highlightEventId?.trim();
    let orderedEvents = events;

    if (trimmedHighlight) {
      const index = events.findIndex((event) => event.id === trimmedHighlight);

      if (index > 0) {
        const highlighted = events[index];
        orderedEvents = [
          highlighted,
          ...events.slice(0, index),
          ...events.slice(index + 1),
        ];
      }
    }

    return orderedEvents.map((event) => {
      const coverUrl = getEventCoverUrl(event);
      const eventDate = formatEventDate(event.eventDate);
      const formatLabel = getEventFormatLabel(event.format);
      const statusLabel = getEventStatusLabel(event.status);

      return (
        <article
          key={event.id}
          className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="md:flex">
            <div className="md:w-64 md:flex-shrink-0">
              <div className="relative aspect-[16/9] md:aspect-auto md:h-full">
                {coverUrl ? (
                  <ImageWithFallback src={coverUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white from-blue-50 to-indigo-50 flex items-center justify-center text-xs text-muted-foreground">
                    Без обложки
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 p-6 space-y-4">
              <div>
                <h3 className="mb-2">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {statusLabel && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BadgeCheck className="w-4 h-4 text-blue-600" />
                    <Badge variant="outline" className="text-xs font-medium">
                      {statusLabel}
                    </Badge>
                  </div>
                )}

                {eventDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{eventDate}</span>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{event.location}</span>
                  </div>
                )}

                {formatLabel && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe2 className="w-4 h-4 text-blue-600" />
                    <span>{formatLabel}</span>
                  </div>
                )}

                {event.region && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPinned className="w-4 h-4 text-blue-600" />
                    <span>{event.region}</span>
                  </div>
                )}

                {event.sphere && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe2 className="w-4 h-4 text-blue-600" />
                    <span>{event.sphere}</span>
                  </div>
                )}
              </div>

              {event.registrationUrl ? (
                <Button asChild className="w-full sm:w-auto">
                  <a href={event.registrationUrl} target="_blank" rel="noreferrer">
                    Зарегистрироваться
                  </a>
                </Button>
              ) : (
                <Button className="w-full sm:w-auto" disabled>
                  Регистрация недоступна
                </Button>
              )}
            </div>
          </div>
        </article>
      );
    });
  }, [events, highlightEventId]);

  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      <div className="bg-whiter from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2">События</h1>
            <p className="text-muted-foreground">
              Технологические конференции, meetup'ы и мероприятия для предпринимателей
            </p>
          </div>

          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                <SlidersHorizontal className="w-4 h-4" />
                Фильтры
                {activeFiltersCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="lg:hidden h-auto max-h-[80vh] overflow-y-auto rounded-t-3xl p-5 pb-6"
            >
              <SheetHeader>
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-5">
                <div className="space-y-2">
                  <Label className="text-sm block">Поиск</Label>
                  <Input value={searchQuery} onChange={handleSearchChange} placeholder="Название события..." />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Статус</Label>
                  <Select value={statusFilter || ""} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все статусы</SelectItem>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Формат</Label>
                  <Select value={formatFilter || ""} onValueChange={handleFormatChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Любой" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Любой</SelectItem>
                      {formatOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Регион</Label>
                  <Select value={regionFilter || ""} onValueChange={handleRegionChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Любой" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Любой</SelectItem>
                      {knownRegions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Сфера</Label>
                  <Select value={sphereFilter || ""} onValueChange={handleSphereChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Любая" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Любая</SelectItem>
                      {knownSpheres.map((sphere) => (
                        <SelectItem key={sphere} value={sphere}>
                          {sphere}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm block">Дата начала</Label>
                    <Input type="date" value={dateFrom} onChange={handleDateFromChange} max={dateTo || undefined} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm block">Дата окончания</Label>
                    <Input type="date" value={dateTo} onChange={handleDateToChange} min={dateFrom || undefined} />
                  </div>
                </div>

                {dateRangeError && <p className="text-sm text-destructive">{dateRangeError}</p>}

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={handleApplyFilters} disabled={Boolean(dateRangeError)}>
                    Применить
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilters}
                  >
                    Сбросить
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isLoading && !hasEvents && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-muted-foreground">
          Загрузка событий...
        </div>
      )}

      {error && !isLoading && !hasEvents && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void loadEvents();
            }}
          >
            Повторить попытку
          </Button>
        </div>
      )}

      {!isLoading && !error && !hasEvents && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-muted-foreground">
          События не найдены. Попробуйте изменить фильтры.
        </div>
      )}

      {hasEvents && <div className="grid gap-6">{renderedEvents}</div>}
    </div>
  );
}
