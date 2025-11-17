import { Search, Mail, Sun, Moon } from "lucide-react";
import { useState } from "react";

import { SearchPanel } from "./SearchPanel";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useTheme } from "../lib/theme";

interface TopHeaderProps {
  onPageChange: (page: string) => void;
}

export function TopHeader({ onPageChange }: TopHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-white backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-colors">
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: '1440px' }}>
        <div 
  className="flex h-14 items-center gap-2 sm:gap-4"
  style={{
    display: window.innerWidth >= 1024 ? 'grid' : 'flex',
    gridTemplateColumns: window.innerWidth >= 1024 ? '240px 1fr 340px' : undefined,
    gap: window.innerWidth >= 1024 ? '2.5rem' : undefined
  }}
>
          {/* Logo - aligned with left sidebar */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center gap-2 items-centerr">
              <span className="text-lg hidden sm:inline">OrientVentus</span>
            </a>
          </div>

          {/* Empty center space for alignment */}
          <div className="flex-1"></div>

          {/* Action buttons - aligned with right sidebar */}
          <div className="flex justify-end gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 dark:border-transparent"
              onClick={toggleTheme}
              aria-label={isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"}
              title={isDark ? "Светлая тема" : "Тёмная тема"}
            >
              {isDark ? <Sun className="w-4 h-4 text-muted-foreground " /> : <Moon className="w-4 h-4 text-muted-foreground " />}
            </Button>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-muted-foreground "
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline text-muted-foreground ">Поиск</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(90vw,560px)] sm:w-[520px] p-0"
                align="end"
                sideOffset={8}
              >
                <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => {
                setSearchOpen(false);
                onPageChange("contacts");
              }}
            >
              <Mail className="w-4 h-4" />
              <span className="hidden lg:inline text-muted-foreground ">Написать автору</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
