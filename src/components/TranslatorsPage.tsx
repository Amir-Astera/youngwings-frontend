import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Languages, MapPin, Clock, Image as ImageIcon, User, SlidersHorizontal } from "lucide-react";
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
  experience?: string;
  experienceYears?: number | null;
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
  const username = response.nickname?.trim();
  const photoUrl =
    resolveFileUrl(response.photoUrl ?? undefined, {
      defaultPrefix: "/api/files/thumbnail/ASSETS",
    }) ??
    resolveFileUrl(response.qrUrl ?? undefined, {
      defaultPrefix: "/api/files/thumbnail/ASSETS",
    }) ?? undefined;

  return {
    id: response.id,
    name,
    languages,
    specialization: specialization || undefined,
    location: location || undefined,
    experience: experience || undefined,
    experienceYears: parseExperienceYears(experience),
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

  const handleExperienceChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setExperienceQuery(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setExperienceQuery("");
    setSelectedLanguage("");
    setSelectedSpecialization("");
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
          selectedSpecialization.trim(),
      ),
    [experienceQuery, searchQuery, selectedLanguage, selectedSpecialization],
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
      allLanguages,
      allSpecializations,
      experienceQuery,
      handleApplyFilters,
      handleExperienceChange,
      handleResetFilters,
      handleSearchChange,
      handleLanguageChange,
      handleSpecializationChange,
      hasActiveFilters,
      searchQuery,
      selectedLanguage,
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
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Фильтры
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div>
                  <Label className="text-sm mb-2 block">Поиск</Label>
                  <Input
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Имя или услуга..."
                  />
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Язык</Label>
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

                <div>
                  <Label className="text-sm mb-2 block">Тип услуги</Label>
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

                <div>
                  <Label className="text-sm mb-2 block">Опыт работы</Label>
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

                <div className="space-y-2">
                  <Button className="w-full" onClick={handleApplyFilters}>
                    Применить
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleResetFilters} disabled={!hasActiveFilters}>
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
              translators.map((translator) => (
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
                            <span>{translator.location ?? "Локация не указана"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Опыт: {translator.experience ?? "не указан"}</span>
                          </div>
                        </div>
                      </div>

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
                          Фото
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
                            <span className="font-medium">Никнейм:</span> {translator.username}
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
                        <div className="mb-3">
                          <h3 className="mb-2">{translator.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin className="w-4 h-4" />
                            <span>{translator.location ?? "Локация не указана"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Опыт: {translator.experience ?? "не указан"}</span>
                          </div>
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
                            Фото
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
                              <span className="font-medium">Никнейм:</span> {translator.username}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
            <DialogTitle>Фото переводчика</DialogTitle>
            <DialogDescription>Просмотр фотографии переводчика</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            {selectedPhoto ? (
              <ImageWithFallback src={selectedPhoto} alt="Фото переводчика" className="w-64 h-64 object-contain" />
            ) : (
              <p className="text-sm text-muted-foreground">Фотография недоступна</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
