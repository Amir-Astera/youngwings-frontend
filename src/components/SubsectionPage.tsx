import { NewsCard } from "./NewsCard";

interface SubsectionPageProps {
  title: string;
  description: string;
  onViewPost?: (postData?: any) => void;
}

const sectionNews: { [key: string]: any[] } = {
  "Бизнес и стартапы": [
    {
      id: 1,
      title: "Топ-10 казахстанских стартапов 2025 года",
      excerpt: "Обзор самых успешных и перспективных стартапов Казахстана, которые привлекли значительные инвестиции и показали впечатляющий рост в этом году.",
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
      category: "Стартапы",
      date: "1 час назад",
      likes: 245,
      comments: 32,
      views: 3200,
    },
    {
      id: 2,
      title: "Как создать стартап с нуля: пошаговое руководство",
      excerpt: "Практическое руководство для начинающих предпринимателей о том, как превратить идею в работающий бизнес.",
      category: "Бизнес",
      date: "3 часа назад",
      likes: 189,
      comments: 45,
      views: 2800,
    },
  ],
  "Экономика и финансы": [
    {
      id: 1,
      title: "Анализ экономических показателей Казахстана за 2025 год",
      excerpt: "Детальный анализ ключевых экономических индикаторов и прогнозы на следующий год.",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800",
      category: "Экономика",
      date: "2 часа назад",
      likes: 312,
      comments: 56,
      views: 4100,
    },
  ],
  "Рынок и аналитика": [
    {
      id: 1,
      title: "Тренды IT-рынка: что ждет отрасль в 2026 году",
      excerpt: "Аналитический обзор текущего состояния IT-рынка и прогнозы развития на следующий год.",
      category: "Аналитика",
      date: "4 часа назад",
      likes: 278,
      comments: 41,
      views: 3600,
    },
  ],
  "Технологии и инновации": [
    {
      id: 1,
      title: "Искусственный интеллект в казахстанских компани��х",
      excerpt: "Как местные компании внедряют AI-решения для автоматизации бизнес-процессов и повышения эффективности.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
      category: "Технологии",
      date: "5 часов назад",
      likes: 421,
      comments: 67,
      views: 5200,
    },
  ],
  "Маркетинг и бренды": [
    {
      id: 1,
      title: "Digital-маркетинг в 2025: новые стратегии и инструменты",
      excerpt: "Обзор самых эффективных маркетинговых стратегий и инструментов для продвижения бизнеса в digital-среде.",
      category: "Маркетинг",
      date: "6 часов назад",
      likes: 298,
      comments: 52,
      views: 3900,
    },
  ],
  "Потребление и лайфстайл": [
    {
      id: 1,
      title: "Как технологии меняют потребительское поведение",
      excerpt: "Исследование влияния новых технологий на привычки потребителей и тренды в сфере лайфстайла.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
      category: "Лайфстайл",
      date: "1 день назад",
      likes: 234,
      comments: 38,
      views: 2900,
    },
  ],
  "Международный бизнес": [
    {
      id: 1,
      title: "Экспорт IT-услуг: опыт казахстанских компаний",
      excerpt: "Как местные IT-компании выходят на международные рынки и успешно конкурируют с глобальными игроками.",
      category: "Международный бизнес",
      date: "1 день назад",
      likes: 267,
      comments: 44,
      views: 3400,
    },
  ],
  "Медиа и контент": [
    {
      id: 1,
      title: "Контент-маркетинг: как создавать истории, которые продают",
      excerpt: "Практические советы по созданию эффективного контента для привлечения и удержания аудитории.",
      image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800",
      category: "Медиа",
      date: "2 дня назад",
      likes: 312,
      comments: 61,
      views: 4200,
    },
  ],
  "Мнения и аналитика": [
    {
      id: 1,
      title: "Будущее технологий: мнения экспертов индустрии",
      excerpt: "Ведущие эксперты делятся своим видением развития технологий и их влияния на общество.",
      category: "Мнения",
      date: "2 дня назад",
      likes: 389,
      comments: 78,
      views: 5100,
    },
  ],
  "Авто и транспорт": [
    {
      id: 1,
      title: "Электромобили в Казахстане: настоящее и будущее",
      excerpt: "Обзор рынка электромобилей, инфраструктуры и перспектив развития электротранспорта в стране.",
      image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800",
      category: "Авто",
      date: "3 дня назад",
      likes: 278,
      comments: 49,
      views: 3700,
    },
  ],
};

export function SubsectionPage({ title, description, onViewPost }: SubsectionPageProps) {
  const news = sectionNews[title] || [];

  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6">
        <h1 className="mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* News Feed */}
      <div className="space-y-5">
        {news.length > 0 ? (
          news.map((item) => <NewsCard key={item.id} {...item} onViewPost={() => onViewPost && onViewPost(item)} />)
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-muted-foreground">
              Материалы в этом разделе скоро появятся. Следите за обновлениями!
            </p>
          </div>
        )}
      </div>

      {/* Load More */}
      {news.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Загрузка новых публикаций...</p>
        </div>
      )}
    </div>
  );
}
