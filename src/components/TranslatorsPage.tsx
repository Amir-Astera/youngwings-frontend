import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Languages, MapPin, Clock, Image as ImageIcon, User, SlidersHorizontal, CalendarDays } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { fetchTranslatorVacancies, resolveFileUrl } from "../lib/api";
import type { TranslatorResponse } from "../types/translator";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Input } from "./ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "./ui/pagination";

interface TranslatorItem {
  id: string;
  name: string;
  languages: string[];
  specialization?: string;
  location?: string;
  region?: string;
  experience?: string;
  experienceYears?: number | null;
  status?: string;
  format?: string;
  eventName?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  username?: string;
  photoUrl?: string;
}

const DEFAULT_PAGE_SIZE = 20;

function parseLanguages(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[,;]+/)
    .map((lang) => lang.trim())
    .filter((lang) => lang.length > 0);
}

function parseExperienceYears(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const match = value.match(/\d+/);

  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[0], 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function mapTranslatorResponse(response: TranslatorResponse): TranslatorItem {
  const name = (response.fullName ?? "").trim() || "Без имени";
  const languages = parseLanguages(response.languages);
  const experience = response.experience?.trim();
  const specialization = response.specialization?.trim();
  const location = response.location?.trim();
  const region = response.region?.trim();
  const status = response.status?.trim();
  const format = response.format?.trim();
  const eventName = response.eventName?.trim();
  const rawEventStartDate =
    response.eventStartDate ?? response.eventDateFrom ?? response.eventDate ?? null;
  const rawEventEndDate = response.eventEndDate ?? response.eventDateTo ?? null;
  const eventStartDate =
    typeof rawEventStartDate === "string" ? rawEventStartDate.trim() : undefined;
  const eventEndDate = typeof rawEventEndDate === "string" ? rawEventEndDate.trim() : undefined;
  const username = response.nickname?.trim();
  const photoUrl =
    resolveFileUrl(response.qrUrl ?? undefined, {
      defaultPrefix: "/api/files/thumbnail/ASSETS",
    }) ?? undefined;

  return {
    id: response.id,
    name,
    languages,
    specialization: specialization || undefined,
    location: location || undefined,
    region: region || undefined,
    experience: experience || undefined,
    experienceYears: parseExperienceYears(experience),
    status: status || undefined,
    format: format || undefined,
    eventName: eventName || undefined,
    eventStartDate: eventStartDate || undefined,
    eventEndDate: eventEndDate || undefined,
    username: username || undefined,
    photoUrl,
  };
}

function getInitials(name?: string): string {
  if (!name) {
    return "П";
  }

  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 2);

  if (parts.length === 0) {
    return "П";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "П";
}

function formatDateSafe(value?: string): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  try {
    return parsed.toLocaleDateString("ru-RU");
  } catch (error) {
    return trimmed;
  }
}

function formatEventPeriod(start?: string, end?: string): string | null {
  const formattedStart = formatDateSafe(start);
  const formattedEnd = formatDateSafe(end);

  if (formattedStart && formattedEnd) {
    if (formattedStart === formattedEnd) {
      return formattedStart;
    }

    return `${formattedStart} — ${formattedEnd}`;
  }

  return formattedStart ?? formattedEnd ?? null;
}

interface TranslatorsPageProps {
  onSidebarFiltersChange?: (content: ReactNode | null) => void;
}

export function TranslatorsPage({ onSidebarFiltersChange }: TranslatorsPageProps) {
  const [translators, setTranslators] = useState<TranslatorItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showUsername, setShowUsername] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [experienceQuery, setExperienceQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [eventNameQuery, setEventNameQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTranslators, setTotalTranslators] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const loadTranslators = useCallback(
    async (signal?: AbortSignal, pageOverride?: number) => {
      setIsLoading(true);
      setError(null);

      const sizeToRequest = pageSize || DEFAULT_PAGE_SIZE;
      const pageToRequest = pageOverride ?? currentPage;

      try {
        const languagesFilter = selectedLanguage.trim()
          ? [selectedLanguage.trim()]
          : [];

        const response = await fetchTranslatorVacancies<TranslatorResponse>({
          page: pageToRequest,
          size: sizeToRequest,
          q: searchQuery,
          languages: languagesFilter.length > 0 ? languagesFilter : undefined,
          specialization: selectedSpecialization ? [selectedSpecialization] : undefined,
          experience: experienceQuery,
          location: selectedCity,
          region: selectedRegion,
          status: selectedStatus,
          format: selectedFormat,
          eventName: eventNameQuery,
          dateFrom,
          dateTo,
          signal,
        });

        if (signal?.aborted) {
          return;
        }

        const mapped = Array.isArray(response.items)
          ? response.items
              .filter((item): item is TranslatorResponse => Boolean(item && typeof item.id === "string"))
              .map(mapTranslatorResponse)
          : [];

        const resolvedTotal = typeof response.total === "number" ? response.total : mapped.length;
        const resolvedSize =
          typeof response.size === "number" && Number.isFinite(response.size)
            ? Math.max(1, Math.round(response.size))
            : sizeToRequest;

        setTranslators(mapped);
        setTotalTranslators(resolvedTotal);
        if (resolvedSize !== pageSize) {
          setPageSize(resolvedSize);
        }
        setShowUsername(null);
        setSelectedPhoto(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        if (!signal?.aborted) {
          setError(err instanceof Error ? err.message : "Не удалось загрузить переводчиков");
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [
      currentPage,
      experienceQuery,
      pageSize,
      searchQuery,
      selectedLanguage,
      selectedCity,
      selectedRegion,
      selectedStatus,
      selectedFormat,
      eventNameQuery,
      dateFrom,
      dateTo,
      selectedSpecialization,
    ],
  );

  const totalPages = useMemo(() => {
    if (!pageSize || pageSize <= 0) {
      return 0;
    }

    return Math.max(0, Math.ceil(totalTranslators / pageSize));
  }, [pageSize, totalTranslators]);

  useEffect(() => {
    const controller = new AbortController();

    void loadTranslators(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadTranslators]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleRetry = useCallback(() => {
    void loadTranslators();
  }, [loadTranslators]);

  // Get unique languages and specializations
  const allLanguages = useMemo(() => {
    const uniqueLanguages = Array.from(
      new Set(
        translators
          .flatMap((translator) => translator.languages)
          .map((lang) => lang.trim())
          .filter((lang) => lang.length > 0),
      ),
    );

    return uniqueLanguages.sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));
  }, [translators]);

  const allSpecializations = useMemo(() => {
    const uniqueSpecializations = Array.from(
      new Set(
        translators
          .map((translator) => translator.specialization?.trim())
          .filter((specialization): specialization is string => Boolean(specialization)),
      ),
    );

    return uniqueSpecializations.sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));
  }, [translators]);

  const allExperiences = useMemo(() => {
    const uniqueExperiences = Array.from(
      new Set(
        translators
          .map((translator) => translator.experience?.trim())
          .filter((experience): experience is string => Boolean(experience)),
      ),
    );

    return uniqueExperiences.sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));
  }, [translators]);

  const allCities = useMemo(() => {
    const uniqueCities = Array.from(
      new Set(
        translators
          .map((translator) => translator.location?.trim())
          .filter((location): location is string => Boolean(location)),
      ),
    );

    return uniqueCities.sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));
  }, [translators]);

  const allRegions = useMemo(() => {
    const uniqueRegions = Array.from(
      new Set(
        translators
          .map((translator) => translator.region?.trim())
          .filter((region): region is string => Boolean(region)),
      ),
    );

    return uniqueRegions.sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));
  }, [translators]);

  const allStatuses = useMemo(() => {
    const uniqueStatuses = Array.from(
      new Set(
        translators
          .map((translator) => translator.status?.trim())
          .filter((status): status is string => Boolean(status)),
      ),
    );

    return uniqueStatuses.sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));
  }, [translators]);

  const allFormats = useMemo(() => {
    const uniqueFormats = Array.from(
      new Set(
        translators
          .map((translator) => translator.format?.trim())
          .filter((format): format is string => Boolean(format)),
      ),
    );

    return uniqueFormats.sort((a, b) => a.localeCompare(b, "ru", { sensitivity: "base" }));
  }, [translators]);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleLanguageChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleSpecializationChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecialization(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleCityChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleRegionChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleFormatChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedFormat(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleEventNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEventNameQuery(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleDateFromChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDateFrom(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleDateToChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDateTo(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleExperienceChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setExperienceQuery(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setExperienceQuery("");
    setSelectedLanguage("");
    setSelectedCity("");
    setSelectedRegion("");
    setSelectedSpecialization("");
    setSelectedStatus("");
    setSelectedFormat("");
    setEventNameQuery("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
    void loadTranslators(undefined, 1);
  }, [loadTranslators]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        searchQuery.trim() ||
          experienceQuery.trim() ||
          selectedLanguage.trim() ||
          selectedCity.trim() ||
          selectedRegion.trim() ||
          selectedSpecialization.trim() ||
          selectedStatus.trim() ||
          selectedFormat.trim() ||
          eventNameQuery.trim() ||
          dateFrom.trim() ||
          dateTo.trim(),
      ),
    [
      dateFrom,
      dateTo,
      eventNameQuery,
      experienceQuery,
      searchQuery,
      selectedCity,
      selectedFormat,
      selectedLanguage,
      selectedRegion,
      selectedSpecialization,
      selectedStatus,
    ],
  );

  const sidebarFilters = useMemo(
    () => (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm mb-4">Фильтры</h3>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Поиск</Label>
          <Input value={searchQuery} onChange={handleSearchChange} placeholder="Имя или услуга..." />
        </div>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Название события</Label>
          <Input
            value={eventNameQuery}
            onChange={handleEventNameChange}
            placeholder="Например, конференция"
          />
        </div>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Статус</Label>
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Любой</option>
            {allStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Формат</Label>
          <select
            value={selectedFormat}
            onChange={handleFormatChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Любой</option>
            {allFormats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Страна</Label>
          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Любая</option>
            {allRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Город</Label>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Любой</option>
            {allCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Период проведения</Label>
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={handleDateFromChange} className="text-sm" />
            <span className="text-muted-foreground text-xs">—</span>
            <Input type="date" value={dateTo} onChange={handleDateToChange} className="text-sm" />
          </div>
        </div>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Язык</Label>
          <select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 overflow-y-auto"
          >
            <option value="">Любой</option>
            {allLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Тип услуги</Label>
          <select
            value={selectedSpecialization}
            onChange={handleSpecializationChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Все услуги</option>
            {allSpecializations.map((specialization) => (
              <option key={specialization} value={specialization}>
                {specialization}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Опыт работы</Label>
          <select
            value={experienceQuery}
            onChange={handleExperienceChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Любой</option>
            {allExperiences.map((experience) => (
              <option key={experience} value={experience}>
                {experience}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" variant="default" onClick={handleApplyFilters}>
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
    ),
    [
      allExperiences,
      allFormats,
      allLanguages,
      allCities,
      allRegions,
      allStatuses,
      allSpecializations,
      dateFrom,
      dateTo,
      eventNameQuery,
      experienceQuery,
      handleApplyFilters,
      handleCityChange,
      handleDateFromChange,
      handleDateToChange,
      handleEventNameChange,
      handleExperienceChange,
      handleFormatChange,
      handleRegionChange,
      handleResetFilters,
      handleSearchChange,
      handleLanguageChange,
      handleStatusChange,
      handleSpecializationChange,
      selectedCity,
      selectedFormat,
      selectedRegion,
      selectedStatus,
      hasActiveFilters,
      selectedLanguage,
      searchQuery,
      selectedSpecialization,
    ],
  );

  useEffect(() => {
    onSidebarFiltersChange?.(sidebarFilters);
  }, [onSidebarFiltersChange, sidebarFilters]);

  useEffect(() => () => {
    onSidebarFiltersChange?.(null);
  }, [onSidebarFiltersChange]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 1) {
      return [] as number[];
    }

    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    const pages: number[] = [];

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1>Переводчики и услуги</h1>

          {/* Filters Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                <SlidersHorizontal className="w-4 h-4" />
                Фильтры
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
                  <Input
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Имя или услуга..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Название события</Label>
                  <Input
                    value={eventNameQuery}
                    onChange={handleEventNameChange}
                    placeholder="Например, конференция"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Статус</Label>
                  <select
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Любой</option>
                    {allStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Формат</Label>
                  <select
                    value={selectedFormat}
                    onChange={handleFormatChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Любой</option>
                    {allFormats.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Страна</Label>
                  <select
                    value={selectedRegion}
                    onChange={handleRegionChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Любая</option>
                    {allRegions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Город</Label>
                  <select
                    value={selectedCity}
                    onChange={handleCityChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Любой</option>
                    {allCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Период проведения</Label>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={dateFrom} onChange={handleDateFromChange} className="text-sm" />
                    <span className="text-muted-foreground text-xs">—</span>
                    <Input type="date" value={dateTo} onChange={handleDateToChange} className="text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Язык</Label>
                  <select
                    value={selectedLanguage}
                    onChange={handleLanguageChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Любой</option>
                    {allLanguages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Тип услуги</Label>
                  <select
                    value={selectedSpecialization}
                    onChange={handleSpecializationChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Все услуги</option>
                    {allSpecializations.map((specialization) => (
                      <option key={specialization} value={specialization}>
                        {specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm block">Опыт работы</Label>
                  <select
                    value={experienceQuery}
                    onChange={handleExperienceChange}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Любой</option>
                    {allExperiences.map((experience) => (
                      <option key={experience} value={experience}>
                        {experience}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <Button size="sm" className="w-full" onClick={handleApplyFilters}>
                    Применить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilters}
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <p className="text-muted-foreground">
          Профессиональные переводчики и языковые услуги для вашего бизнеса
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-5">
          <h2>Наши переводчики</h2>
            {isLoading && translators.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-muted-foreground">
                Загрузка переводчиков...
              </div>
            ) : error && translators.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-3">
                <p className="text-muted-foreground text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Повторить попытку
                </Button>
              </div>
            ) : translators.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <p className="text-muted-foreground">
                  Переводчики по выбранным фильтрам не найдены
                </p>
              </div>
            ) : (
              translators.map((translator) => {
                const eventPeriod = formatEventPeriod(translator.eventStartDate, translator.eventEndDate);

                return (
                  <div
                    key={translator.id}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                  <div className="p-6">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      {/* Top: Photo and Name */}
                      <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20">
                          {translator.photoUrl ? (
                            <AvatarImage
                              src={translator.photoUrl}
                              alt={`Фото переводчика ${translator.name}`}
                              className="object-cover"
                            />
                          ) : null}
                          <AvatarFallback className="bg-blue-50 text-blue-700 font-semibold text-lg">
                            {getInitials(translator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="mb-2">{translator.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {translator.region && translator.location
                                ? `${translator.region}, ${translator.location}`
                                : translator.region ?? translator.location ?? "Локация не указана"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Опыт: {translator.experience ?? "не указан"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Event info */}
                      {(translator.eventName || eventPeriod || translator.status || translator.format) && (
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {translator.eventName && (
                            <p>
                              <span className="text-gray-900">Событие:</span> {translator.eventName}
                            </p>
                          )}
                          {eventPeriod && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="w-4 h-4" />
                              <span>{eventPeriod}</span>
                            </div>
                          )}
                          {translator.status && (
                            <p>
                              <span className="text-gray-900">Статус:</span> {translator.status}
                            </p>
                          )}
                          {translator.format && (
                            <p>
                              <span className="text-gray-900">Формат:</span> {translator.format}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Languages */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Languages className="w-4 h-4 text-primary" />
                          <span className="text-sm">Языки:</span>
                        </div>
                        {translator.languages.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {translator.languages.map((lang, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Языки не указаны</p>
                        )}
                      </div>

                      {/* Specialization */}
                      <p className="text-sm text-muted-foreground">
                        <span className="text-gray-900">Специализация:</span> {translator.specialization ?? "не указана"}
                      </p>

                      {/* Buttons */}
                      <div className="flex gap-3 flex-wrap">
                        <Button
                          size="sm"
                          className="gap-2 flex-1"
                          onClick={() => translator.photoUrl && setSelectedPhoto(translator.photoUrl)}
                          disabled={!translator.photoUrl}
                        >
                          <ImageIcon className="w-4 h-4" />
                          QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 flex-1"
                          onClick={() => setShowUsername(showUsername === translator.id ? null : translator.id)}
                          disabled={!translator.username}
                        >
                          <User className="w-4 h-4" />
                          Показать ватсап
                        </Button>
                      </div>

                      {/* Username Display */}
                      {showUsername === translator.id && translator.username && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">
                            <span className="font-medium">Ватсап номер:</span> {translator.username}
                          </p>
                        </div>
                      )}
                    </div>

                      {/* Desktop Layout */}
                    <div className="hidden md:flex gap-6">
                      {/* Photo - Left Side */}
                      <Avatar className="w-32 h-32 rounded-xl">
                        {translator.photoUrl ? (
                          <AvatarImage
                            src={translator.photoUrl}
                            alt={`Фото переводчика ${translator.name}`}
                            className="object-cover"
                          />
                        ) : null}
                        <AvatarFallback className="rounded-xl bg-blue-50 text-blue-700 font-semibold text-xl">
                          {getInitials(translator.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content - Right Side */}
                      <div className="flex-1">
                        <div className="mb-3 space-y-2">
                          <h3 className="mb-2">{translator.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {translator.region && translator.location
                                ? `${translator.region}, ${translator.location}`
                                : translator.region ?? translator.location ?? "Локация не указана"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Опыт: {translator.experience ?? "не указан"}</span>
                          </div>
                          {(translator.eventName || eventPeriod || translator.status || translator.format) && (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {translator.eventName && (
                                <p>
                                  <span className="text-gray-900">Событие:</span> {translator.eventName}
                                </p>
                              )}
                              {eventPeriod && (
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="w-4 h-4" />
                                  <span>{eventPeriod}</span>
                                </div>
                              )}
                              {translator.status && (
                                <p>
                                  <span className="text-gray-900">Статус:</span> {translator.status}
                                </p>
                              )}
                              {translator.format && (
                                <p>
                                  <span className="text-gray-900">Формат:</span> {translator.format}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Languages className="w-4 h-4 text-primary" />
                            <span className="text-sm">Языки:</span>
                          </div>
                          {translator.languages.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {translator.languages.map((lang, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                                >
                                  {lang}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Языки не указаны</p>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                          <span className="text-gray-900">Специализация:</span> {translator.specialization ?? "не указана"}
                        </p>

                        <div className="flex gap-3 flex-wrap">
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={() => translator.photoUrl && setSelectedPhoto(translator.photoUrl)}
                            disabled={!translator.photoUrl}
                          >
                            <ImageIcon className="w-4 h-4" />
                            QR
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => setShowUsername(showUsername === translator.id ? null : translator.id)}
                            disabled={!translator.username}
                          >
                            <User className="w-4 h-4" />
                            Показать ватсап
                          </Button>
                        </div>

                        {showUsername === translator.id && translator.username && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <span className="font-medium">Ватсап номер:</span> {translator.username}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            )}
        </div>

        {totalPages > 1 && (
            <Pagination className="pt-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : undefined}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage((prev) => Math.max(1, prev - 1));
                      }
                    }}
                  />
                </PaginationItem>

                {visiblePages.length > 0 && visiblePages[0] > 1 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === 1}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(1);
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {visiblePages[0] > 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {visiblePages.map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < totalPages && (
                  <>
                    {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === totalPages}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === totalPages}
                    tabIndex={currentPage === totalPages ? -1 : undefined}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      if (currentPage < totalPages) {
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
          <h3 className="mb-3">Нужна помощь с подбором переводчика?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Свяжитесь с нами, и мы поможем найти подходящего специалиста для вашего проекта
          </p>
          <Button className="gap-2">
            Связаться с нами
          </Button>
        </div>
      </div>

      {/* Photo Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR переводчика</DialogTitle>
            <DialogDescription>Просмотр QR-кода переводчика</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            {selectedPhoto ? (
              <ImageWithFallback src={selectedPhoto} alt="QR переводчика" className="w-64 h-64 object-contain" />
            ) : (
              <p className="text-sm text-muted-foreground">QR-код недоступен</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
