import type { PostSummary } from "../types/post";
import { NewsCard } from "./NewsCard";

interface SubsectionPageProps {
  title: string;
  description: string;
  posts: PostSummary[];
  onViewPost?: (postData?: PostSummary) => void;
  onPostUpdate?: (
    postId: string,
    metrics: { likes?: number; dislikes?: number; views?: number; comments?: number }
  ) => void;
  registerVisibility?: (element: HTMLElement | null, postId: string) => void;
}

export function SubsectionPage({
  title,
  description,
  posts,
  onViewPost,
  onPostUpdate,
  registerVisibility,
}: SubsectionPageProps) {
  const news = posts;

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
          news.map((item) => (
            <NewsCard
              key={item.id}
              {...item}
              onViewPost={() => onViewPost?.(item)}
              onPostUpdate={onPostUpdate}
              visibilityObserver={registerVisibility}
            />
          ))
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
