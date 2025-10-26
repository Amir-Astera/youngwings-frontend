import { Search, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white">N</span>
              </div>
              <span className="text-xl">NewsHub</span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Главная
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Технологии
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Бизнес
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Стартапы
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Инновации
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Карьера
              </a>
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:block">
              {searchOpen ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Поиск..."
                    className="w-64"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost">
                Войти
              </Button>
              <Button>
                Регистрация
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Главная
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Технологии
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Бизнес
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Стартапы
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Инновации
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                Карьера
              </a>
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <Button variant="ghost" className="w-full justify-start">
                  Войти
                </Button>
                <Button className="w-full justify-start">
                  Регистрация
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
