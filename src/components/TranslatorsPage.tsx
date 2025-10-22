import { useCallback, useEffect, useMemo, useState } from "react";
import { Languages, MapPin, Clock, QrCode, User, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { fetchTranslatorVacancies, resolveFileUrl } from "../lib/api";
import type { TranslatorResponse } from "../types/translator";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface TranslatorItem {
  id: string;
  name: string;
  languages: string[];
  specialization?: string;
  location?: string;
  experience?: string;
  experienceYears?: number | null;
  username?: string;
  qrCode?: string;
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
  const qrCode =
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
    qrCode,
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

const services = [
  {
    id: 1,
    title: "Письменный перевод",
    description: "Перевод документов, статей, контрактов и другой письменной документации",
    price: "От 1000 ₸ за страницу",
  },
  {
    id: 2,
    title: "Устный перевод",
    description: "Синхронный и последовательный перевод на мероприятиях и встречах",
    price: "От 10000 ₸ за час",
  },
  {
    id: 3,
    title: "Локализация",
    description: "Адаптация контента под местную аудиторию, включая веб-сайты и приложения",
    price: "От 2000 ₸ за час",
  },
  {
    id: 4,
    title: "Редактура и корректура",
    description: "Проверка и улучшение качества переведенных текстов",
    price: "От 800 ₸ за страницу",
  },
];

export function TranslatorsPage() {
  const [translators, setTranslators] = useState<TranslatorItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [showUsername, setShowUsername] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [languageFilters, setLanguageFilters] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState<string>("all");

  const loadTranslators = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchTranslatorVacancies<TranslatorResponse>({
          page: 1,
          size: DEFAULT_PAGE_SIZE,
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

        setTranslators(mapped);
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
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadTranslators(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadTranslators]);

  const handleRetry = useCallback(() => {
    void loadTranslators();
  }, [loadTranslators]);

  // Get unique locations and languages
  const locations = useMemo(
    () =>
      Array.from(
        new Set(
          translators
            .map((translator) => translator.location)
            .filter((location): location is string => Boolean(location)),
        ),
      ),
    [translators],
  );
  const allLanguages = useMemo(
    () => Array.from(new Set(translators.flatMap((translator) => translator.languages))),
    [translators],
  );

  // Toggle language filter
  const toggleLanguageFilter = (lang: string) => {
    setLanguageFilters(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  // Filter translators
  const filteredTranslators = useMemo(() => {
    return translators.filter((translator) => {
      const locationMatch = locationFilter === "all" || translator.location === locationFilter;
      const languageMatch =
        languageFilters.length === 0 || languageFilters.some((lang) => translator.languages.includes(lang));

      let experienceMatch = true;

      if (experienceFilter !== "all") {
        const thresholds: Record<string, number> = {
          "5+": 5,
          "8+": 8,
          "10+": 10,
        };

        const threshold = thresholds[experienceFilter];

        if (threshold !== undefined) {
          experienceMatch = (translator.experienceYears ?? 0) >= threshold;
        }
      }

      return locationMatch && languageMatch && experienceMatch;
    });
  }, [experienceFilter, languageFilters, locationFilter, translators]);

  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1>Переводчики и услуги</h1>
          
          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Фильтры
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
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
                        <RadioGroupItem value={location} id={`loc-${index}`} />
                        <Label htmlFor={`loc-${index}`} className="text-sm cursor-pointer">{location}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Language Filter */}
                <div>
                  <Label className="text-sm mb-3 block">Языки</Label>
                  <div className="space-y-2">
                    {allLanguages.map((lang, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`lang-${index}`}
                          checked={languageFilters.includes(lang)}
                          onCheckedChange={() => toggleLanguageFilter(lang)}
                        />
                        <Label htmlFor={`lang-${index}`} className="text-sm cursor-pointer">{lang}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Filter */}
                <div>
                  <Label className="text-sm mb-3 block">Опыт</Label>
                  <RadioGroup value={experienceFilter} onValueChange={setExperienceFilter}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="all" id="exp-all" />
                      <Label htmlFor="exp-all" className="text-sm cursor-pointer">Все</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="5+" id="exp-5" />
                      <Label htmlFor="exp-5" className="text-sm cursor-pointer">5+ лет</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="8+" id="exp-8" />
                      <Label htmlFor="exp-8" className="text-sm cursor-pointer">8+ лет</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="10+" id="exp-10" />
                      <Label htmlFor="exp-10" className="text-sm cursor-pointer">10+ лет</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Reset Button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setLocationFilter("all");
                    setLanguageFilters([]);
                    setExperienceFilter("all");
                  }}
                >
                  Сбросить фильтры
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <p className="text-muted-foreground">
          Профессиональные переводчики и языковые услуги для вашего бизнеса
        </p>
      </div>

      {/* Translators List */}
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
        ) : filteredTranslators.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-muted-foreground">
              Переводчики по выбранным фильтрам не найдены
            </p>
          </div>
        ) : (
          filteredTranslators.map((translator) => (
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
                    onClick={() => translator.qrCode && setSelectedQR(translator.qrCode)}
                    disabled={!translator.qrCode}
                  >
                    <QrCode className="w-4 h-4" />
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
                    Показать никнейм
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
                      onClick={() => translator.qrCode && setSelectedQR(translator.qrCode)}
                      disabled={!translator.qrCode}
                    >
                      <QrCode className="w-4 h-4" />
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
                      Показать никнейм
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
        )))}
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="mb-3">Нужна помощь с подбором переводчика?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Свяжитесь с нами, и мы поможем найти подходящего специалиста для вашего проекта
        </p>
        <Button className="gap-2">
          Связаться с нами
        </Button>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!selectedQR} onOpenChange={() => setSelectedQR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR-код переводчика</DialogTitle>
            <DialogDescription>
              Отсканируйте QR-код для связи с переводчиком
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            {selectedQR ? (
              <ImageWithFallback src={selectedQR} alt="QR Code" className="w-64 h-64 object-contain" />
            ) : (
              <p className="text-sm text-muted-foreground">QR-код недоступен</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
