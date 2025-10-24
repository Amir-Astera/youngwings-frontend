import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Globe2, MapPinned } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { fetchEvents } from "../lib/api";
import { formatEventDate, getEventCoverUrl, getEventFormatLabel } from "../lib/events";
import type { EventResponse } from "../types/event";

const PAGE_SIZE = 20;

interface EventsPageProps {
  highlightEventId?: string | null;
}

export function EventsPage({ highlightEventId }: EventsPageProps) {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchEvents<EventResponse>({ page: 1, size: PAGE_SIZE, signal });

        if (signal?.aborted) {
          return;
        }

        setEvents(Array.isArray(response.items) ? response.items : []);
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
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadEvents(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadEvents]);

  const hasEvents = events.length > 0;

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
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-xs text-muted-foreground">
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6">
        <h1 className="mb-2">События</h1>
        <p className="text-muted-foreground">
          Технологические конференции, meetup'ы и мероприятия для предпринимателей
        </p>
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

      {hasEvents && <div className="grid gap-6">{renderedEvents}</div>}
    </div>
  );
}
