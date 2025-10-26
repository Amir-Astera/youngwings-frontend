import { useCallback, useEffect, useState } from "react";
import { Calendar, MapPin, ChevronRight, Globe2 } from "lucide-react";
import { Button } from "./ui/button";
import { fetchEvents } from "../lib/api";
import { formatEventDate, getEventFormatLabel } from "../lib/events";
import type { EventResponse } from "../types/event";

const PAGE_SIZE = 20;

interface UpcomingEventsPageProps {
  onPageChange: (page: string) => void;
}

function isUpcomingEvent(eventDate?: string): boolean {
  if (!eventDate) {
    return true;
  }

  const eventDay = new Date(eventDate);

  if (Number.isNaN(eventDay.getTime())) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDay.setHours(0, 0, 0, 0);

  return eventDay >= today;
}

export function UpcomingEventsPage({ onPageChange }: UpcomingEventsPageProps) {
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

        const items = Array.isArray(response.items) ? response.items : [];
        setEvents(items.filter((event) => isUpcomingEvent(event.eventDate)));
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

  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      <div className="bg-white from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6">
        <h1 className="mb-2">Ближайшие события</h1>
        <p className="text-muted-foreground">
          Актуальные митапы, воркшопы и нетворкинг мероприятия
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

      {hasEvents && (
        <div className="space-y-5">
          {events.map((event) => {
            const eventDate = formatEventDate(event.eventDate);
            const formatLabel = getEventFormatLabel(event.format);

            return (
              <article
                key={event.id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="mb-2">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {event.registrationUrl ? (
                      <Button asChild size="sm" className="gap-2">
                        <a href={event.registrationUrl} target="_blank" rel="noreferrer">
                          Зарегистрироваться
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" className="gap-2" disabled>
                        Регистрация недоступна
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
        <h3 className="mb-3">Смотрите все крупные выставки и события</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Технологические конференции, саммиты и международные выставки
        </p>
        <Button onClick={() => onPageChange("exhibitions")} className="gap-2">
          Все события
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
