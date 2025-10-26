import { Home, Calendar, Languages } from "lucide-react";

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

interface LeftSidebarProps {
  currentPage: "home" | "exhibitions" | "translators" | "about" | "contacts" | string;
  onPageChange: (page: string) => void;
}

export function LeftSidebar({ currentPage, onPageChange }: LeftSidebarProps) {
  return (
    <aside className="space-y-4 sticky top-20">
      {/* Main Section with Subsections */}
      <nav className="space-y-2">
        <button
          onClick={() => onPageChange("home")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left ${
            currentPage === "home"
              ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-black backdrop-blur-sm border border-blue-200/50 shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Главная</span>
        </button>

        {/* Subsections with vertical line - always visible */}
        <div className="relative pl-4 ml-3">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200"></div>
          <div className="space-y-0.5">
            {subSections.map((section) => (
              <button
                key={section}
                onClick={() => onPageChange(`subsection-${section}`)}
                className={`block w-full text-left px-2 py-1.5 text-sm transition-colors font-normal whitespace-nowrap overflow-hidden text-ellipsis rounded-lg ${
                  currentPage === `subsection-${section}`
                    ? "text-[#717182] bg-blue-50"
                    : "text-[#717182] hover:bg-gray-50"
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Other Main Sections */}
      <nav className="space-y-2">
        <button
          onClick={() => onPageChange("exhibitions")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left ${
            currentPage === "exhibitions"
              ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-black backdrop-blur-sm border border-blue-200/50 shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Calendar className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Выставки и события</span>
        </button>
        
        <button
          onClick={() => onPageChange("translators")}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all w-full text-left ${
            currentPage === "translators"
              ? "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-black backdrop-blur-sm border border-blue-200/50 shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Languages className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Переводчики и услуги</span>
        </button>
      </nav>

      {/* Footer Links - Neutral Style */}
      <div className="pt-6 mt-6 border-t border-gray-200">
        <div className="space-y-1">
          <button
            onClick={() => onPageChange("about")}
            className="block w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            О проекте
          </button>
          <button
            onClick={() => onPageChange("contacts")}
            className="block w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Контакты
          </button>
        </div>
      </div>
    </aside>
  );
}
