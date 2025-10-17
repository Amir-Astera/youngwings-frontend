import { useState, useEffect } from "react";
import { LeftSidebar } from "./components/LeftSidebar";
import { TopHeader } from "./components/TopHeader";
import { MobileMenu } from "./components/MobileMenu";
import { NewsCard } from "./components/NewsCard";
import { RightSidebar } from "./components/RightSidebar";
import { EventsPage } from "./components/EventsPage";
import { TopicPage } from "./components/TopicPage";
import { UpcomingEventsPage } from "./components/UpcomingEventsPage";
import { AboutPage } from "./components/AboutPage";
import { ExhibitionsPage } from "./components/ExhibitionsPage";
import { TranslatorsPage } from "./components/TranslatorsPage";
import { ContactsPage } from "./components/ContactsPage";
import { SubsectionPage } from "./components/SubsectionPage";
import { PostPage } from "./components/PostPage";
import { Toaster } from "./components/ui/sonner";

const newsItems = [
  {
    id: 1,
    title: "Astana Hub объявила о запуске новой акселерационной программы для технологических стартапов",
    excerpt:
      "Международный технопарк IT-стартапов Astana Hub запускает масштабную программу поддержки для инновационных проектов в области искусственного интеллекта, блокчейна и финтеха. Программа рассчитана на 6 месяцев и предоставляет участникам доступ к менторам, инвесторам и партнерам.",
    image: "https://images.unsplash.com/photo-1702047135360-e549c2e1f7df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwc3RhcnR1cHxlbnwxfHx8fDE3NjAxMjgzNTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Стартапы",
    date: "2 часа назад",
    likes: 342,
    comments: 45,
    views: 4200,
  },
  {
    id: 2,
    title: "Казахстанские стартапы привлекли $50 млн инвестиций в третьем квартале 2025 года",
    excerpt:
      "Согласно новым данным, объем венчурных инвестиций в казахстанские технологические компании достиг рекордных показателей. Основные средства были направлены в сферы EdTech, FinTech и HealthTech.",
    category: "Инвестиции",
    date: "4 часа назад",
    likes: 256,
    comments: 32,
    views: 3100,
  },
  {
    id: 3,
    title: "ИИ-платформа из Казахстана выходит на международный рынок",
    excerpt:
      "Стартап, разрабатывающий решения на основе искусственного интеллекта для автоматизации бизнес-процессов, объявил о начале экспансии в страны Центральной Азии и СНГ после успешного раунда финансирования.",
    image: "https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlfGVufDF8fHx8MTc2MDA2ODM2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Технологии",
    date: "6 часов назад",
    likes: 189,
    comments: 28,
    views: 2800,
  },
  {
    id: 4,
    title: "Как удаленная работа меняет IT-индустрию Казахстана",
    excerpt:
      "Исследование показало, что более 70% IT-специалистов в Казахстане предпочитают гибридный формат работы. Компании адаптируются к новым реалиям и пересматривают подходы к управлению командами.",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2V8ZW58MXx8fHwxNzYwMTE3MTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Карьера",
    date: "8 часов назад",
    likes: 143,
    comments: 56,
    views: 1900,
  },
  {
    id: 5,
    title: "Новые возможности для разработчиков: обзор технологических трендов 2025",
    excerpt:
      "От нейросетей до квантовых вычислений - разбираем ключевые направления развития технологий, которые будут определять будущее IT-индустрии в ближайшие годы.",
    category: "Технологии",
    date: "12 часов назад",
    likes: 298,
    comments: 67,
    views: 5600,
  },
  {
    id: 6,
    title: "Цифровая трансформация: кейсы успешного внедрения в казахстанском бизнесе",
    excerpt:
      "Как местные компании используют современные технологии для оптимизации процессов и повышения конкурентоспособности. Реальные примеры и результаты.",
    image: "https://images.unsplash.com/photo-1644325349124-d1756b79dd42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwdHJhbnNmb3JtYXRpb258ZW58MXx8fHwxNzYwMDMwMTQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Бизнес",
    date: "1 день назад",
    likes: 176,
    comments: 41,
    views: 2300,
  },
  {
    id: 7,
    title: "Топ-10 навыков для IT-специалистов в 2025 году",
    excerpt:
      "Какие компетенции наиболее востребованы на рынке труда и как развивать их эффективно. Советы от экспертов индустрии и успешных профессионалов.",
    category: "Карьера",
    date: "1 день назад",
    likes: 421,
    comments: 89,
    views: 8900,
  },
  {
    id: 8,
    title: "Блокчейн в государственном секторе: перспективы и вызовы",
    excerpt:
      "Анализ потенциала технологии распределенного реестра для улучшения государственных услуг и повышения прозрачности административных процессов.",
    category: "Технологии",
    date: "2 дня назад",
    likes: 234,
    comments: 52,
    views: 3400,
  },
  {
    id: 9,
    title: "EdTech революция: как меняется образование в Казахстане",
    excerpt:
      "Обзор самых интересных образовательных платформ и инициатив, которые трансформируют традиционную систему обучения и делают знания более доступными.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbm5vdmF0aW9uJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjAwMzk2NDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Образование",
    date: "2 дня назад",
    likes: 312,
    comments: 74,
    views: 4500,
  },
  {
    id: 10,
    title: "Кибербезопасность в эпоху облачных технологий",
    excerpt:
      "Новые вызовы и решения для защиты данных в облачной инфраструктуре. Экспертные рекомендации по обеспечению безопасности корпоративных систем.",
    category: "Технологии",
    date: "3 дня назад",
    likes: 187,
    comments: 34,
    views: 2700,
  },
  {
    id: 11,
    title: "Зеленые технологии: как IT помогает решать экологические проблемы",
    excerpt:
      "Инновационные решения для снижения углеродного следа и оптимизации ресурсов с помощью современных технологий.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbm5vdmF0aW9uJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjAwMzk2NDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "Инновации",
    date: "3 дня назад",
    likes: 245,
    comments: 41,
    views: 3200,
  },
  {
    id: 12,
    title: "Метавселенная и будущее социальных взаимодействий",
    excerpt:
      "Как виртуальная реальность меняет способы общения, работы и развлечений. Перспективы развития метавселенной в ближайшие годы.",
    category: "Технологии",
    date: "4 дня назад",
    likes: 356,
    comments: 78,
    views: 5100,
  },
];

const subsectionDescriptions: { [key: string]: string } = {
  "Бизнес и стартапы": "Новости стартап-экосистемы, истории успеха и советы для предпринимателей",
  "Экономика и финансы": "Анализ экономических тенденций, финансовые новости и инвестиции",
  "Рынок и аналитика": "Исследования рынка, аналитика и прогнозы развития индустрии",
  "Технологии и инновации": "Последние достижения в мире технологий и инновационные решения",
  "Маркетинг и бренды": "Тренды маркетинга, кейсы успешных брендов и стратегии продвижения",
  "Потребление и лайфстайл": "Влияние технологий на повседневную жизнь и потребительские тренды",
  "Международный бизнес": "Глобальные бизнес-тренды и выход на международные рынки",
  "Медиа и контент": "Контент-маркетинг, медиа-стратегии и создание вовлекающего контента",
  "Мнения и аналитика": "Экспертные мнения, колонки и глубокая аналитика",
  "Авто и транспорт": "Новости автомобильной индустрии и транспортных технологий",
};

function getSubsectionDescription(subsection: string): string {
  return subsectionDescriptions[subsection] || "Актуальные материалы по теме";
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [viewingPost, setViewingPost] = useState(false);
  const [currentPostData, setCurrentPostData] = useState<any>(null);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Reset viewingPost when page changes
  useEffect(() => {
    setViewingPost(false);
    setCurrentPostData(null);
  }, [currentPage]);

  const handleViewPost = (postData?: any) => {
    setCurrentPostData(postData);
    setViewingPost(true);
  };

  const handleBackFromPost = () => {
    setViewingPost(false);
    setCurrentPostData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader />
      <MobileMenu currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <div className="mt-[104px] lg:mt-14">
        <main className="mx-auto lg:py-8 py-2">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_380px] gap-5 lg:gap-8 max-w-[1400px] mx-auto px-4 sm:px-8">
            {/* Left Sidebar - Navigation */}
            <div className="hidden lg:block pt-6">
              <LeftSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
            </div>

            {/* Main Content */}
            <div className="min-h-[calc(100vh-10rem)]">
              {viewingPost && currentPage === "home" && (
                <PostPage onBack={handleBackFromPost} postData={currentPostData} />
              )}
              
              {!viewingPost && currentPage === "home" && (
                <div className="space-y-3 sm:space-y-5 lg:pt-6 pt-1">
                  <div className="space-y-3 sm:space-y-5">
                    {newsItems.map((item) => (
                      <NewsCard key={item.id} {...item} onViewPost={() => handleViewPost(item)} />
                    ))}
                  </div>
                  
                  {/* Infinite scroll indicator */}
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Загрузка новых публикаций...</p>
                  </div>
                </div>
              )}

              {currentPage === "exhibitions" && <ExhibitionsPage />}

              {currentPage === "translators" && <TranslatorsPage />}

              {currentPage === "about" && <AboutPage />}

              {currentPage === "contacts" && <ContactsPage />}

              {currentPage.startsWith("subsection-") && !viewingPost && (
                <SubsectionPage
                  title={currentPage.replace("subsection-", "")}
                  description={getSubsectionDescription(currentPage.replace("subsection-", ""))}
                  onViewPost={(postData) => handleViewPost(postData)}
                />
              )}
              
              {currentPage.startsWith("subsection-") && viewingPost && (
                <PostPage onBack={handleBackFromPost} postData={currentPostData} />
              )}

              {currentPage === "events" && <EventsPage />}

              {currentPage === "upcoming-events" && <UpcomingEventsPage onPageChange={setCurrentPage} />}

              {currentPage.startsWith("topic-") && !viewingPost && (
                <TopicPage topic={currentPage.replace("topic-", "")} onViewPost={(postData) => handleViewPost(postData)} />
              )}
              
              {currentPage.startsWith("topic-") && viewingPost && (
                <PostPage onBack={handleBackFromPost} postData={currentPostData} />
              )}
            </div>

            {/* Right Sidebar - Scrolls with page */}
            <div className="hidden lg:block">
              <RightSidebar 
                onPageChange={setCurrentPage} 
                currentPage={currentPage}
                filterContent={
                  currentPage === "exhibitions" ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <h3 className="text-sm mb-4">Фильтры</h3>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Поиск</label>
                        <input
                          type="text"
                          placeholder="Название события..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Регион</label>
                        <select size={5} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <option>Все регионы</option>
                          <option>Алматы</option>
                          <option>Астана</option>
                          <option>Шымкент</option>
                          <option>Караганда</option>
                          <option>Актобе</option>
                          <option>Тараз</option>
                          <option>Павлодар</option>
                          <option>Костанай</option>
                          <option>Кызылорда</option>
                          <option>Атырау</option>
                          <option>Актау</option>
                          <option>Усть-Каменогорск</option>
                          <option>Семей</option>
                          <option>Петропавловск</option>
                          <option>Талдыкорган</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Сфера</label>
                        <select size={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <option>Все сферы</option>
                          <option>Технологии</option>
                          <option>Бизнес</option>
                          <option>Искусство</option>
                          <option>Наука</option>
                          <option>Образование</option>
                          <option>Медицина</option>
                          <option>Финансы</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Статус</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          <option>Все</option>
                          <option>Предстоящие</option>
                          <option>Завершенные</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Формат</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          <option>Любой</option>
                          <option>Онлайн</option>
                          <option>Офлайн</option>
                          <option>Гибрид</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Даты проведения</label>
                        <div className="space-y-2">
                          <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                          <input type="date" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
                        </div>
                      </div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Применить
                      </button>
                    </div>
                  ) : currentPage === "translators" ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <h3 className="text-sm mb-4">Фильтры</h3>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Поиск</label>
                        <input
                          type="text"
                          placeholder="Имя или услуга..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Язык (с)</label>
                        <select size={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <option>Любой</option>
                          <option>Русский</option>
                          <option>Английский</option>
                          <option>Казахский</option>
                          <option>Китайский</option>
                          <option>Турецкий</option>
                          <option>Корейский</option>
                          <option>Немецкий</option>
                          <option>Французский</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Язык (на)</label>
                        <select size={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          <option>Любой</option>
                          <option>Русский</option>
                          <option>Английский</option>
                          <option>Казахский</option>
                          <option>Китайский</option>
                          <option>Турецкий</option>
                          <option>Корейский</option>
                          <option>Немецкий</option>
                          <option>Французский</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Тип услуги</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          <option>Все услуги</option>
                          <option>Письменный перевод</option>
                          <option>Устный перевод</option>
                          <option>Синхронный перевод</option>
                          <option>Технический перевод</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-2 block">Опыт работы</label>
                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600">
                          <option>Любой</option>
                          <option>До 1 года</option>
                          <option>1-3 года</option>
                          <option>3-5 лет</option>
                          <option>5+ лет</option>
                        </select>
                      </div>
                      <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Применить
                      </button>
                    </div>
                  ) : undefined
                }
              />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-16 bg-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
            <div className="text-center text-sm text-muted-foreground">
              <p>© 2025 YoungWings. Все права защищены.</p>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
