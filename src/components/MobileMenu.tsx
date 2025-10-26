import { useState } from "react";
import { Menu, X, Home, Calendar, Languages, Info, Phone } from "lucide-react";
import { Button } from "./ui/button";

const subSections = [
  "Бизнес и стартапы",
  "Экономика и финансы",
  "Рынок и аналитика",
  "Технологии и инновации",
  "Маркетинг и бренды",
  "Потребление и лайфстайл",
  "Международный бизнес",
  "Медиа и контент",
  "Мнения и аналитика",
  "Авто и транспорт",
];

interface MobileMenuProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function MobileMenu({ currentPage, onPageChange }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsOpen(false);
  };

  return (
    <>
      {/* Horizontal scrollable menu with subsections */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-14 z-30 overflow-hidden">
        <div className="flex items-center gap-2 px-4 overflow-x-auto scrollbar-hide py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Hamburger menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="flex-shrink-0 gap-2 border border-gray-200 h-9"
          >
            <Menu className="w-4 h-4" />
          </Button>

          {/* Main section */}
          <button
            onClick={() => onPageChange("home")}
            className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
              currentPage === "home"
                ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 border border-blue-200/50"
                : "text-gray-700 hover:bg-gray-50 border border-transparent"
            }`}
          >
            Главная
          </button>

          {/* Subsections */}
          {subSections.map((section) => (
            <button
              key={section}
              onClick={() => onPageChange(`subsection-${section}`)}
              className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                currentPage === `subsection-${section}`
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50 border border-transparent"
              }`}
            >
              {section}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden shadow-xl overflow-y-auto">
            <div className="p-4">
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg">Меню</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Menu items */}
              <nav className="space-y-2">
                <button
                  onClick={() => handlePageChange("exhibitions")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left ${
                    currentPage === "exhibitions"
                      ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 border border-blue-200/50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Calendar className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Выставки и события</span>
                </button>

                <button
                  onClick={() => handlePageChange("translators")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left ${
                    currentPage === "translators"
                      ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 border border-blue-200/50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Languages className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Переводчики и услуги</span>
                </button>

                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={() => handlePageChange("about")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left ${
                      currentPage === "about"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">О проекте</span>
                  </button>

                  <button
                    onClick={() => handlePageChange("contacts")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left ${
                      currentPage === "contacts"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Phone className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">Контакты</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
