import { useState } from "react";
import { Languages, MapPin, Clock, QrCode, User, UserCircle, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const translators = [
  {
    id: 1,
    name: "Айгуль Нурланова",
    languages: ["Русский", "Английский", "Казахский"],
    specialization: "Технические переводы, IT-документация",
    location: "Алматы",
    experience: "8 лет",
    username: "@aigul_translator",
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=@aigul_translator"
  },
  {
    id: 2,
    name: "Дмитрий Ким",
    languages: ["Английский", "Корейский", "Русский"],
    specialization: "Деловые переводы, контракты",
    location: "Астана",
    experience: "10 лет",
    username: "@dmitry_kim_translator",
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=@dmitry_kim_translator"
  },
  {
    id: 3,
    name: "Лейла Сабитова",
    languages: ["Французский", "Русский", "Английский"],
    specialization: "Юридические переводы",
    location: "Алматы",
    experience: "6 лет",
    username: "@leila_legal",
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=@leila_legal"
  },
  {
    id: 4,
    name: "Марат Токтаров",
    languages: ["Немецкий", "Русский", "Казахский"],
    specialization: "Технические переводы, маркетинг",
    location: "Шымкент",
    experience: "7 лет",
    username: "@marat_tech",
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=@marat_tech"
  },
];

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
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [showUsername, setShowUsername] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [languageFilters, setLanguageFilters] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState<string>("all");

  // Get unique locations and languages
  const locations = Array.from(new Set(translators.map(t => t.location)));
  const allLanguages = Array.from(new Set(translators.flatMap(t => t.languages)));

  // Toggle language filter
  const toggleLanguageFilter = (lang: string) => {
    setLanguageFilters(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  // Filter translators
  const filteredTranslators = translators.filter(translator => {
    const locationMatch = locationFilter === "all" || translator.location === locationFilter;
    const languageMatch = languageFilters.length === 0 || 
                         languageFilters.some(lang => translator.languages.includes(lang));
    const experienceYears = parseInt(translator.experience);
    const experienceMatch = experienceFilter === "all" ||
                           (experienceFilter === "5+" && experienceYears >= 5) ||
                           (experienceFilter === "8+" && experienceYears >= 8) ||
                           (experienceFilter === "10+" && experienceYears >= 10);
    return locationMatch && languageMatch && experienceMatch;
  });

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
        {filteredTranslators.length === 0 ? (
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
                    <AvatarFallback>
                      <UserCircle className="w-full h-full text-gray-400" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="mb-2">{translator.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>{translator.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Опыт: {translator.experience}</span>
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4 text-primary" />
                    <span className="text-sm">Языки:</span>
                  </div>
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
                </div>

                {/* Specialization */}
                <p className="text-sm text-muted-foreground">
                  <span className="text-gray-900">Специализация:</span> {translator.specialization}
                </p>

                {/* Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <Button 
                    size="sm" 
                    className="gap-2 flex-1"
                    onClick={() => setSelectedQR(translator.qrCode)}
                  >
                    <QrCode className="w-4 h-4" />
                    QR
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 flex-1"
                    onClick={() => setShowUsername(showUsername === translator.id ? null : translator.id)}
                  >
                    <User className="w-4 h-4" />
                    Показать никнейм
                  </Button>
                </div>

                {/* Username Display */}
                {showUsername === translator.id && (
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
                  <AvatarFallback className="rounded-xl">
                    <UserCircle className="w-full h-full text-gray-400" />
                  </AvatarFallback>
                </Avatar>

                {/* Content - Right Side */}
                <div className="flex-1">
                  <div className="mb-3">
                    <h3 className="mb-2">{translator.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="w-4 h-4" />
                      <span>{translator.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Опыт: {translator.experience}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="w-4 h-4 text-primary" />
                      <span className="text-sm">Языки:</span>
                    </div>
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
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    <span className="text-gray-900">Специализация:</span> {translator.specialization}
                  </p>

                  <div className="flex gap-3 flex-wrap">
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setSelectedQR(translator.qrCode)}
                    >
                      <QrCode className="w-4 h-4" />
                      QR
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => setShowUsername(showUsername === translator.id ? null : translator.id)}
                    >
                      <User className="w-4 h-4" />
                      Показать никнейм
                    </Button>
                  </div>

                  {showUsername === translator.id && (
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
            {selectedQR && (
              <img 
                src={selectedQR} 
                alt="QR Code" 
                className="w-64 h-64 object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
