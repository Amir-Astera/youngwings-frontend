import { NewsCard } from "./NewsCard";

interface TopicPageProps {
  topic: string;
  onViewPost?: (postData?: any) => void;
}

const topicPosts: { [key: string]: any[] } = {
  "Искусственный интеллект": [
    {
      id: 1,
      title: "GPT-5 представлен публике: революция в AI-технологиях",
      excerpt: "OpenAI анонсировала новую версию своей языковой модели с беспрецедентными возможностями понимания и генерации текста.",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
      category: "Искусственный интеллект",
      date: "1 час назад",
      likes: 456,
      comments: 89,
      views: 5600,
    },
    {
      id: 2,
      title: "Как AI меняет медицину: новые возможности диагностики",
      excerpt: "Искусственный интеллект позволяет врачам ставить диагнозы быстрее и точнее благодаря анализу больших данных.",
      category: "Искусственный интеллект",
      date: "3 часа н��зад",
      likes: 312,
      comments: 67,
      views: 4200,
    },
  ],
  "Стартапы": [
    {
      id: 1,
      title: "Топ-10 казахстанских стартапов 2025 года",
      excerpt: "Обзор самых успешных и перспективных стартапов Казахстана, которые привлекли значительные инвестиции.",
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800",
      category: "Стартапы",
      date: "2 часа назад",
      likes: 389,
      comments: 54,
      views: 4800,
    },
  ],
  "Блокчейн": [
    {
      id: 1,
      title: "Новые возможности блокчейна в финансовом секторе",
      excerpt: "Как технология распределенных реестров трансформирует банковскую индустрию и платежные системы.",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800",
      category: "Блокчейн",
      date: "4 часа назад",
      likes: 267,
      comments: 43,
      views: 3500,
    },
  ],
  "Финтех": [
    {
      id: 1,
      title: "Цифровые банки: будущее финансовых услуг",
      excerpt: "Как необанки меняют традиционную банковскую индустрию и предлагают новые подходы к финансовым услугам.",
      category: "Финтех",
      date: "5 часов назад",
      likes: 298,
      comments: 51,
      views: 3900,
    },
  ],
  "EdTech": [
    {
      id: 1,
      title: "Онлайн-образование в 2025: тренды и прогнозы",
      excerpt: "Как технологии меняют подход к обучению и делают качественное образование доступным для всех.",
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800",
      category: "EdTech",
      date: "1 день назад",
      likes: 234,
      comments: 38,
      views: 3200,
    },
  ],
};

export function TopicPage({ topic, onViewPost }: TopicPageProps) {
  // Convert URL-safe topic back to display name (e.g., "Искусственный-интеллект" -> "Искусственный интеллект")
  const topicName = topic.replace(/-/g, ' ');
  const posts = topicPosts[topicName] || topicPosts[topic] || [];

  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 rounded-xl p-6">
        <h1 className="mb-2">{topicName}</h1>
        <p className="text-muted-foreground">
          Все материалы по теме "{topicName}"
        </p>
      </div>

      {/* Posts Feed */}
      <div className="space-y-5">
        {posts.length > 0 ? (
          posts.map((post) => <NewsCard key={post.id} {...post} onViewPost={() => onViewPost && onViewPost(post)} />)
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-muted-foreground">
              Материалы по этой теме скоро появятся. Следите за обновлениями!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
