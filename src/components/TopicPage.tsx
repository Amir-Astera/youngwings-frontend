import type { PostCountersState, PostPersonalState, PostSummary } from "../types/post";
import { NewsCard } from "./NewsCard";

interface TopicPageProps {
  topic: string;
  posts: PostSummary[];
  onViewPost?: (postData?: PostSummary) => void;
  onPostUpdate?: (
    postId: string,
    metrics: { likes?: number; dislikes?: number; views?: number; comments?: number }
  ) => void;
  registerVisibility?: (element: HTMLElement | null, postId: string) => void;
  countersById?: Record<string, PostCountersState>;
  onPersonalStateUpdate?: (postId: string, patch: PostPersonalState) => void;
}

function normaliseTopic(value: string) {
  return value
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function TopicPage({
  topic,
  posts,
  onViewPost,
  onPostUpdate,
  registerVisibility,
  countersById,
  onPersonalStateUpdate,
}: TopicPageProps) {
  const topicName = topic.replace(/-/g, " ");
  const normalizedTopic = normaliseTopic(topicName);

  const filteredPosts = posts.filter((post) => {
    if (!post.topic) {
      return false;
    }

    return normaliseTopic(post.topic) === normalizedTopic;
  });

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
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <NewsCard
              key={post.id}
              {...post}
              likes={countersById?.[post.id]?.likes ?? post.likes}
              dislikes={countersById?.[post.id]?.dislikes ?? post.dislikes}
              comments={countersById?.[post.id]?.comments ?? post.comments}
              views={countersById?.[post.id]?.views ?? post.views}
              myReaction={post.myReaction ?? null}
              hasViewed={post.hasViewed ?? false}
              onViewPost={() => onViewPost?.(post)}
              onPostUpdate={onPostUpdate}
              onPersonalStateUpdate={onPersonalStateUpdate}
              visibilityObserver={registerVisibility}
            />
          ))
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
