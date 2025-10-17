import { Search, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useState } from "react";

export function TopHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
        <div className="flex lg:grid lg:grid-cols-[240px_1fr_380px] gap-2 sm:gap-4 lg:gap-8 h-14 items-center">
          {/* Logo - aligned with left sidebar */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[rgb(21,93,252)] rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">YW</span>
              </div>
              <span className="text-lg hidden sm:inline">YoungWings</span>
            </a>
          </div>

          {/* Empty center space for alignment */}
          <div className="flex-1"></div>

          {/* Action buttons - aligned with right sidebar */}
          <div className="flex justify-end gap-2 flex-shrink-0">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 border-gray-200"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Поиск</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[90vw] sm:w-[600px] p-0" 
                align="end"
                sideOffset={8}
              >
                <div className="p-4 border-b">
                  <h3 className="mb-3">Поиск</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Введите запрос..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="p-6 min-h-[250px]">
                  {searchQuery ? (
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">Результаты поиска для "{searchQuery}"</p>
                      <p className="text-xs mt-2">Функция поиска в разработке</p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm mb-4">Начните вводить запрос для поиска</p>
                      <div className="space-y-2 text-left max-w-md mx-auto">
                        <p className="text-xs">Популярные запросы:</p>
                        <div className="flex flex-wrap gap-2">
                          {["Искусственный интеллект", "Стартапы", "Блокчейн", "Технологии"].map((query) => (
                            <button
                              key={query}
                              onClick={() => setSearchQuery(query)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
                            >
                              {query}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="sm" className="gap-2 border-gray-200">
              <Mail className="w-4 h-4" />
              <span className="hidden lg:inline">Написать автору</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
