import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, ChevronRight, SlidersHorizontal, Share2, Twitter, Facebook, Link2 } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner";

import { buildEventShareUrl, fetchEvents } from "../lib/api";
import { formatEventDateRange, getEventCoverUrl, getEventFormatLabel } from "../lib/events";
import type { EventResponse } from "../types/event";

function getEventStatus(eventDate?: string): "upcoming" | "completed" {
  if (!eventDate) {
    return "upcoming";
  }

  const eventDay = new Date(eventDate);

  if (Number.isNaN(eventDay.getTime())) {
    return "upcoming";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDay.setHours(0, 0, 0, 0);

  return eventDay >= today ? "upcoming" : "completed";
}

export function ExhibitionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchEvents<EventResponse>({ page: 1, size: 20, signal });

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
          setEvents([]);
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

  const locations = useMemo(() => {
    const unique = new Set<string>();

    for (const event of events) {
      const location = event.location?.trim();

      if (location) {
        unique.add(location);
      }
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b, "ru"));
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const status = getEventStatus(event.eventDate);
      const location = event.location?.trim();

      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "upcoming" && status === "upcoming") ||
        (statusFilter === "completed" && status === "completed");
      const locationMatch = locationFilter === "all" || location === locationFilter;

      return statusMatch && locationMatch;
    });
  }, [events, locationFilter, statusFilter]);

  const handleShare = async (platform: string, title: string, shareUrl?: string) => {
    const fallbackShareUrl = buildEventShareUrl();
    const url = shareUrl?.trim() || fallbackShareUrl || window.location.href;

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`, "_blank");
        break;
      case "instagram":
        toast.info("Instagram не поддерживает прямое шаринг. Скопируйте ссылку!");
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          "_blank",
        );
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          "_blank",
        );
        break;
      case "tiktok":
        toast.info("TikTok не поддерживает прямое шаринг. Скопируйте ссылку!");
        break;
      case "threads":
        window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(title + " " + url)}`, "_blank");
        break;
      case "copy":
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
            toast.success("Ссылка скопирована!");
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = url;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
              document.execCommand('copy');
              toast.success("Ссылка скопирована!");
            } catch (err) {
              toast.error("Не удалось скопировать ссылку");
            }
            document.body.removeChild(textArea);
          }
        } catch (err) {
          toast.error("Не удалось скопировать. URL: " + url);
        }
        break;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1>Выставки и события</h1>

          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Фильтры
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh]">
              <SheetHeader>
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Status Filter */}
                <div>
                  <Label className="text-sm mb-3 block">Статус</Label>
                  <RadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="all" id="status-all" />
                      <Label htmlFor="status-all" className="text-sm cursor-pointer">Все</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="upcoming" id="status-upcoming" />
                      <Label htmlFor="status-upcoming" className="text-sm cursor-pointer">Предстоящие</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="completed" id="status-completed" />
                      <Label htmlFor="status-completed" className="text-sm cursor-pointer">Завершенные</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Location Filter */}
                <div>
                  <Label className="text-sm mb-3 block">Локация</Label>
                  <RadioGroup value={locationFilter} onValueChange={setLocationFilter}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="all" id="location-all" />
                      <Label htmlFor="location-all" className="text-sm cursor-pointer">Все</Label>
                    </div>
                    {locations.map((location, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={location} id={`location-${index}`} />
                        <Label htmlFor={`location-${index}`} className="text-sm cursor-pointer">{location}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Reset Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setStatusFilter("all");
                    setLocationFilter("all");
                  }}
                >
                  Сбросить фильтры
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <p className="text-muted-foreground">
          Актуальная информация о предстоящих технологических выставках, конференциях и событиях
        </p>
      </div>

      {/* Main Exhibitions */}
      <div className="space-y-5">
        {isLoading && events.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-muted-foreground">
            Загрузка событий...
          </div>
        )}

        {error && !isLoading && events.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void loadEvents()}>
              Повторить попытку
            </Button>
          </div>
        )}

        {!isLoading && filteredEvents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-muted-foreground">
              Выставки по выбранным фильтрам не найдены
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const title = event.title?.trim() || "Без названия";
            const description = event.description?.trim();
            const location = event.location?.trim();
            const registrationUrl = event.registrationUrl?.trim();
            const dateLabel =
              formatEventDateRange(event.eventDate, event.eventEndDate) || "Дата уточняется";
            const coverUrl = getEventCoverUrl(event);
            const formatLabel = getEventFormatLabel(event.format);
            const shareUrl = buildEventShareUrl(event.id);
            const status = getEventStatus(event.eventDate);

            return (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Mobile Layout */}
                  <div className="md:hidden space-y-4">
                    {/* Top: Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{dateLabel}</span>
                    </div>

                    {/* Middle: Photo */}
                    {coverUrl && (
                      <div className="w-full h-40 overflow-hidden rounded-xl">
                        <img
                          src={coverUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Location and Share in one row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>{location ?? "Локация уточняется"}</span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="end">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 justify-start gap-2"
                              onClick={() => handleShare("whatsapp", title, shareUrl)}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#25D366"/>
                              </svg>
                              <span className="text-xs">WhatsApp</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 justify-start gap-2"
                              onClick={() => handleShare("instagram", title, shareUrl)}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#instagram-gradient)"/>
                                <defs>
                                  <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#FD5949"/>
                                    <stop offset="50%" stopColor="#D6249F"/>
                                    <stop offset="100%" stopColor="#285AEB"/>
                                  </linearGradient>
                                </defs>
                              </svg>
                              <span className="text-xs">Instagram</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 justify-start gap-2"
                              onClick={() => handleShare("twitter", title, shareUrl)}
                            >
                              <Twitter className="w-4 h-4 text-blue-400" />
                              <span className="text-xs">Twitter</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 justify-start gap-2"
                              onClick={() => handleShare("facebook", title, shareUrl)}
                            >
                              <Facebook className="w-4 h-4 text-blue-600" />
                              <span className="text-xs">Facebook</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 justify-start gap-2"
                              onClick={() => handleShare("telegram", title, shareUrl)}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" fill="#0088cc"/>
                              </svg>
                              <span className="text-xs">Telegram</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 justify-start gap-2"
                              onClick={() => handleShare("tiktok", title, shareUrl)}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                              </svg>
                              <span className="text-xs">TikTok</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 justify-start gap-2"
                              onClick={() => handleShare("threads", title, shareUrl)}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.579.877-6.433 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192-.12-.382-.223-.573-.318-.31 1.43-.857 2.657-1.627 3.65-1.194 1.54-2.87 2.318-4.986 2.318-1.373 0-2.508-.407-3.376-1.21-.89-.823-1.337-1.912-1.337-3.241 0-1.454.537-2.664 1.596-3.598 1.06-.935 2.474-1.41 4.205-1.41.96 0 1.857.14 2.664.42.328-1.112.537-2.344.623-3.668C13.262 6.04 12.65 6 12 6c-3.037 0-5.5 2.463-5.5 5.5S8.963 17 12 17c1.66 0 3.144-.736 4.156-1.898.507-.582.898-1.273 1.156-2.05.387.176.764.384 1.125.623 1.288.852 2.152 2.011 2.57 3.446.673 2.311.016 5.138-1.743 7.514-1.442 1.95-3.564 2.945-6.316 2.961l-.178.004z"/>
                              </svg>
                              <span className="text-xs">Threads</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-9 justify-start gap-2"
                              onClick={() => handleShare("copy", title, shareUrl)}
                            >
                              <Link2 className="w-4 h-4" />
                              <span className="text-xs">Скопировать ссылку</span>
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Title and Description */}
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="flex-1">{title}</h2>
                        <span
                          className={`ml-4 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                            status === "upcoming"
                              ? "bg-blue-600/20 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200"
                              : "bg-gray-800/10 text-gray-800 dark:bg-gray-700/30 dark:text-gray-200"
                          }`}
                        >
                          {status === "upcoming" ? "Предстоящее" : "Завершенное"}
                        </span>
                      </div>

                      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
                      {formatLabel && (
                        <div className="text-xs text-blue-600 mb-4">Формат: {formatLabel}</div>
                      )}

                      <div className="flex items-center justify-end">
                        {registrationUrl ? (
                          <Button asChild size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-8 px-3 text-sm">
                            <a href={registrationUrl} target="_blank" rel="noreferrer">
                              Регистрация
                              <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" className="gap-1.5 h-8 px-3 text-sm" disabled>
                            Регистрация недоступна
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:flex gap-6">
                    {/* Left: Photo */}
                    {coverUrl && (
                      <div className="w-48 h-36 overflow-hidden rounded-xl flex-shrink-0">
                        <img
                          src={coverUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Right: Content */}
                    <div className="flex-1 flex flex-col">
                      {/* Top: Date, Location, Share */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>{dateLabel}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>{location ?? "Локация уточняется"}</span>
                          </div>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2" align="end">
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 justify-start gap-2"
                                onClick={() => handleShare("whatsapp", title, shareUrl)}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#25D366"/>
                                </svg>
                                <span className="text-xs">WhatsApp</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 justify-start gap-2"
                                onClick={() => handleShare("instagram", title, shareUrl)}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#instagram-gradient-desktop)"/>
                                  <defs>
                                    <linearGradient id="instagram-gradient-desktop" x1="0%" y1="100%" x2="100%" y2="0%">
                                      <stop offset="0%" stopColor="#FD5949"/>
                                      <stop offset="50%" stopColor="#D6249F"/>
                                      <stop offset="100%" stopColor="#285AEB"/>
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <span className="text-xs">Instagram</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 justify-start gap-2"
                                onClick={() => handleShare("twitter", title, shareUrl)}
                              >
                                <Twitter className="w-4 h-4 text-blue-400" />
                                <span className="text-xs">Twitter</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 justify-start gap-2"
                                onClick={() => handleShare("facebook", title, shareUrl)}
                              >
                                <Facebook className="w-4 h-4 text-blue-600" />
                                <span className="text-xs">Facebook</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 justify-start gap-2"
                                onClick={() => handleShare("telegram", title, shareUrl)}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" fill="#0088cc"/>
                                </svg>
                                <span className="text-xs">Telegram</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 justify-start gap-2"
                                onClick={() => handleShare("tiktok", title, shareUrl)}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                                </svg>
                                <span className="text-xs">TikTok</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 justify-start gap-2"
                                onClick={() => handleShare("threads", title, shareUrl)}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.579.877-6.433 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192-.12-.382-.223-.573-.318-.31 1.43-.857 2.657-1.627 3.65-1.194 1.54-2.87 2.318-4.986 2.318-1.373 0-2.508-.407-3.376-1.21-.89-.823-1.337-1.912-1.337-3.241 0-1.454.537-2.664 1.596-3.598 1.06-.935 2.474-1.41 4.205-1.41.96 0 1.857.14 2.664.42.328-1.112.537-2.344.623-3.668C13.262 6.04 12.65 6 12 6c-3.037 0-5.5 2.463-5.5 5.5S8.963 17 12 17c1.66 0 3.144-.736 4.156-1.898.507-.582.898-1.273 1.156-2.05.387.176.764.384 1.125.623 1.288.852 2.152 2.011 2.57 3.446.673 2.311.016 5.138-1.743 7.514-1.442 1.95-3.564 2.945-6.316 2.961l-.178.004z"/>
                                </svg>
                                <span className="text-xs">Threads</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-9 justify-start gap-2"
                                onClick={() => handleShare("copy", title, shareUrl)}
                              >
                                <Link2 className="w-4 h-4" />
                                <span className="text-xs">Скопировать ссылку</span>
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Title */}
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="flex-1">{title}</h2>
                        <span
                          className={`ml-4 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                            status === "upcoming"
                              ? "bg-blue-600/20 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200"
                              : "bg-gray-800/10 text-gray-800 dark:bg-gray-700/30 dark:text-gray-200"
                          }`}
                        >
                          {status === "upcoming" ? "Предстоящее" : "Завершенное"}
                        </span>
                      </div>

                      {/* Description */}
                      {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
                      {formatLabel && (
                        <div className="text-xs text-blue-600 mb-4">Формат: {formatLabel}</div>
                      )}

                      {/* Bottom: Button */}
                      <div className="flex items-center justify-end mt-auto">
                        {registrationUrl ? (
                          <Button asChild size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-8 px-3 text-sm">
                            <a href={registrationUrl} target="_blank" rel="noreferrer">
                              Регистрация
                              <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" className="gap-1.5 h-8 px-3 text-sm" disabled>
                            Регистрация недоступна
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
