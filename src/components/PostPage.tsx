import { useCallback, useEffect, useRef, useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Eye,
  ArrowLeft,
  Twitter,
  Facebook,
  Link2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner@2.0.3";
import { TipTapContent } from "./TipTapContent";
import type { PostSummary, PostResponse } from "../types/post";
import type { CommentResponse } from "../types/comment";
import {
  clearCommentReaction,
  clearPostReaction,
  createComment,
  fetchComments,
  registerPostView,
  sendCommentDislike,
  sendCommentLike,
  sendPostDislike,
  sendPostLike,
} from "../lib/api";
import { formatRelativeTime } from "../lib/dates";
import { hasViewBeenRecorded, markViewRecorded } from "../lib/clientState";

interface PostPageProps {
  onBack: () => void;
  postData?: PostSummary | null;
  onPostUpdate?: (
    postId: string,
    metrics: { likes?: number; dislikes?: number; views?: number; comments?: number }
  ) => void;
}

const COMMENTS_PAGE_SIZE = 20;

function getCommentDisplayDate(createdAt?: string): string {
  if (!createdAt) {
    return "";
  }

  const relative = formatRelativeTime(createdAt);

  if (relative) {
    return relative;
  }

  const date = new Date(createdAt);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return "";
}

function getCommentAuthor(name?: string | null): string {
  return name?.trim() || "Аноним";
}

export function PostPage({ onBack, postData, onPostUpdate }: PostPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(postData?.likes ?? 0);
  const [dislikeCount, setDislikeCount] = useState(postData?.dislikes ?? 0);
  const [viewCount, setViewCount] = useState(postData?.views ?? 0);
  const [commentCount, setCommentCount] = useState(postData?.comments ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentReactions, setCommentReactions] = useState<Record<string, { liked: boolean; disliked: boolean }>>({});
  const [reactionPendingByComment, setReactionPendingByComment] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isReactionPending, setIsReactionPending] = useState(false);
  const [isViewPending, setIsViewPending] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const viewRegisteredRef = useRef(false);
  const commentsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setLikeCount(postData?.likes ?? 0);
    setDislikeCount(postData?.dislikes ?? 0);
    setViewCount(postData?.views ?? 0);
    setCommentCount(postData?.comments ?? 0);
    setIsLiked(false);
    setIsDisliked(false);
    setIsReactionPending(false);
    setIsViewPending(false);
    setShowComments(false);
    setComments([]);
    setCommentReactions({});
    setReactionPendingByComment({});
    setCommentsPage(1);
    setHasMoreComments(false);
    setCommentsError(null);
    commentsAbortRef.current?.abort();
    commentsAbortRef.current = null;
    viewRegisteredRef.current = hasViewBeenRecorded(postData?.id);
  }, [postData]);

  const applyMetrics = useCallback(
    (response?: PostResponse | null, fallback?: { likes?: number; dislikes?: number; views?: number }) => {
      const metrics: { likes?: number; dislikes?: number; views?: number } = {};

      const sources = [
        response
          ? {
              likes:
                typeof response.likeCount === "number" && Number.isFinite(response.likeCount)
                  ? response.likeCount
                  : undefined,
              dislikes:
                typeof response.dislikeCount === "number" && Number.isFinite(response.dislikeCount)
                  ? response.dislikeCount
                  : undefined,
              views:
                typeof response.viewCount === "number" && Number.isFinite(response.viewCount)
                  ? response.viewCount
                  : undefined,
            }
          : undefined,
        fallback,
      ];

      for (const source of sources) {
        if (!source) {
          continue;
        }

        if (typeof source.likes === "number" && Number.isFinite(source.likes)) {
          metrics.likes = source.likes;
        }

        if (typeof source.dislikes === "number" && Number.isFinite(source.dislikes)) {
          metrics.dislikes = source.dislikes;
        }

        if (typeof source.views === "number" && Number.isFinite(source.views)) {
          metrics.views = source.views;
        }
      }

      if (metrics.likes !== undefined) {
        setLikeCount(metrics.likes);
      }

      if (metrics.dislikes !== undefined) {
        setDislikeCount(metrics.dislikes);
      }

      if (metrics.views !== undefined) {
        setViewCount(metrics.views);
      }

      if (postData?.id && onPostUpdate && Object.keys(metrics).length > 0) {
        onPostUpdate(postData.id, metrics);
      }

      return metrics;
    },
    [onPostUpdate, postData?.id]
  );

  useEffect(() => {
    if (!postData?.id || viewRegisteredRef.current || isViewPending) {
      return;
    }

    const currentViewCount = viewCount;
    viewRegisteredRef.current = true;
    setIsViewPending(true);
    setViewCount((value) => value + 1);

    registerPostView(postData.id)
      .then((response) => {
        markViewRecorded(postData.id);
        applyMetrics(response, { views: currentViewCount + 1 });
      })
      .catch(() => {
        viewRegisteredRef.current = false;
        setViewCount(currentViewCount);
      })
      .finally(() => {
        setIsViewPending(false);
      });
  }, [applyMetrics, isViewPending, postData?.id, viewCount]);

  const loadComments = useCallback(
    async ({ page, append = false }: { page: number; append?: boolean }) => {
      if (!postData?.id) {
        return;
      }

      const controller = new AbortController();
      commentsAbortRef.current?.abort();
      commentsAbortRef.current = controller;

      if (!append) {
        setIsCommentsLoading(true);
        setCommentsError(null);
      }

      try {
        const response = await fetchComments(postData.id, {
          page,
          size: COMMENTS_PAGE_SIZE,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        const items = Array.isArray(response.items) ? response.items : [];

        setComments((previous) => {
          if (append) {
            const existingIds = new Set(previous.map((item) => item.id));
            const merged = [...previous];

            for (const item of items) {
              if (!existingIds.has(item.id)) {
                merged.push(item);
              }
            }

            return merged;
          }

          return items;
        });

        const nextPage = typeof response.page === "number" ? response.page : page;
        const size = typeof response.size === "number" ? response.size : COMMENTS_PAGE_SIZE;
        const total = typeof response.total === "number" ? response.total : items.length;

        setCommentsPage(nextPage);
        setCommentCount(total);
        setHasMoreComments(total > nextPage * size);

        setCommentReactions((previous) => {
          const base = append ? { ...previous } : {};

          for (const item of items) {
            if (!base[item.id]) {
              base[item.id] = { liked: false, disliked: false };
            }
          }

          return base;
        });

        if (postData.id && onPostUpdate) {
          onPostUpdate(postData.id, { comments: total });
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!append) {
          setCommentsError("Не удалось загрузить комментарии");
        } else {
          toast.error("Не удалось загрузить дополнительные комментарии");
        }
      } finally {
        if (!append) {
          setIsCommentsLoading(false);
        }

        if (commentsAbortRef.current === controller) {
          commentsAbortRef.current = null;
        }
      }
    },
    [onPostUpdate, postData?.id]
  );

  useEffect(() => {
    if (!showComments) {
      commentsAbortRef.current?.abort();
      return;
    }

    loadComments({ page: 1 });
  }, [loadComments, showComments]);

  const applyCommentMetrics = useCallback(
    (
      commentId: string,
      response?: CommentResponse | null,
      fallback?: { likes?: number; dislikes?: number }
    ) => {
      const metrics: { likes?: number; dislikes?: number } = {};

      const sources = [
        response
          ? {
              likes:
                typeof response.likeCount === "number" && Number.isFinite(response.likeCount)
                  ? response.likeCount
                  : undefined,
              dislikes:
                typeof response.dislikeCount === "number" && Number.isFinite(response.dislikeCount)
                  ? response.dislikeCount
                  : undefined,
            }
          : undefined,
        fallback,
      ];

      for (const source of sources) {
        if (!source) {
          continue;
        }

        if (typeof source.likes === "number" && Number.isFinite(source.likes)) {
          metrics.likes = source.likes;
        }

        if (typeof source.dislikes === "number" && Number.isFinite(source.dislikes)) {
          metrics.dislikes = source.dislikes;
        }
      }

      if (metrics.likes === undefined && metrics.dislikes === undefined) {
        return metrics;
      }

      setComments((previous) =>
        previous.map((comment) => {
          if (comment.id !== commentId) {
            return comment;
          }

          return {
            ...comment,
            likeCount: metrics.likes ?? comment.likeCount,
            dislikeCount: metrics.dislikes ?? comment.dislikeCount,
          };
        })
      );

      return metrics;
    },
    []
  );

  const handleLike = useCallback(async () => {
    if (!postData?.id || isReactionPending) {
      return;
    }

    const previous = {
      likeCount,
      dislikeCount,
      isLiked,
      isDisliked,
    };

    setIsReactionPending(true);

    try {
      if (isLiked) {
        const nextLikes = Math.max(0, previous.likeCount - 1);
        setIsLiked(false);
        setLikeCount((value) => Math.max(0, value - 1));
        const response = await clearPostReaction(postData.id);
        applyMetrics(response, { likes: nextLikes, dislikes: previous.dislikeCount });
      } else {
        setIsLiked(true);
        setLikeCount((value) => value + 1);

        if (isDisliked) {
          setIsDisliked(false);
          setDislikeCount((value) => Math.max(0, value - 1));
        }

        const response = await sendPostLike(postData.id);
        const nextLikes = previous.likeCount + 1;
        const nextDislikes = isDisliked ? Math.max(0, previous.dislikeCount - 1) : previous.dislikeCount;
        applyMetrics(response, { likes: nextLikes, dislikes: nextDislikes });
      }
    } catch (error) {
      setIsLiked(previous.isLiked);
      setIsDisliked(previous.isDisliked);
      setLikeCount(previous.likeCount);
      setDislikeCount(previous.dislikeCount);
      toast.error("Не удалось обновить реакцию. Попробуйте ещё раз.");
    } finally {
      setIsReactionPending(false);
    }
  }, [applyMetrics, isDisliked, isLiked, isReactionPending, likeCount, dislikeCount, postData?.id]);

  const handleDislike = useCallback(async () => {
    if (!postData?.id || isReactionPending) {
      return;
    }

    const previous = {
      likeCount,
      dislikeCount,
      isLiked,
      isDisliked,
    };

    setIsReactionPending(true);

    try {
      if (isDisliked) {
        const nextDislikes = Math.max(0, previous.dislikeCount - 1);
        setIsDisliked(false);
        setDislikeCount((value) => Math.max(0, value - 1));
        const response = await clearPostReaction(postData.id);
        applyMetrics(response, { dislikes: nextDislikes, likes: previous.likeCount });
      } else {
        setIsDisliked(true);
        setDislikeCount((value) => value + 1);

        if (isLiked) {
          setIsLiked(false);
          setLikeCount((value) => Math.max(0, value - 1));
        }

        const response = await sendPostDislike(postData.id);
        const nextDislikes = previous.dislikeCount + 1;
        const nextLikes = isLiked ? Math.max(0, previous.likeCount - 1) : previous.likeCount;
        applyMetrics(response, { dislikes: nextDislikes, likes: nextLikes });
      }
    } catch (error) {
      setIsLiked(previous.isLiked);
      setIsDisliked(previous.isDisliked);
      setLikeCount(previous.likeCount);
      setDislikeCount(previous.dislikeCount);
      toast.error("Не удалось обновить реакцию. Попробуйте ещё раз.");
    } finally {
      setIsReactionPending(false);
    }
  }, [applyMetrics, isDisliked, isLiked, isReactionPending, likeCount, dislikeCount, postData?.id]);

  const handleCommentLike = useCallback(
    async (commentId: string) => {
      if (reactionPendingByComment[commentId]) {
        return;
      }

      const comment = comments.find((item) => item.id === commentId);

      if (!comment) {
        return;
      }

      const reaction = commentReactions[commentId] ?? { liked: false, disliked: false };

      setReactionPendingByComment((previous) => ({ ...previous, [commentId]: true }));

      const previousState = {
        liked: reaction.liked,
        disliked: reaction.disliked,
        likes: comment.likeCount,
        dislikes: comment.dislikeCount,
      };

      try {
        if (reaction.liked) {
          setCommentReactions((previous) => ({ ...previous, [commentId]: { liked: false, disliked: false } }));
          const nextLikes = Math.max(0, comment.likeCount - 1);
          applyCommentMetrics(commentId, undefined, {
            likes: nextLikes,
            dislikes: comment.dislikeCount,
          });
          const response = await clearCommentReaction(commentId);
          applyCommentMetrics(commentId, response, {
            likes: nextLikes,
            dislikes: comment.dislikeCount,
          });
        } else {
          const nextLikes = comment.likeCount + 1;
          const nextDislikes = reaction.disliked ? Math.max(0, comment.dislikeCount - 1) : comment.dislikeCount;
          setCommentReactions((previous) => ({ ...previous, [commentId]: { liked: true, disliked: false } }));
          applyCommentMetrics(commentId, undefined, {
            likes: nextLikes,
            dislikes: nextDislikes,
          });
          const response = await sendCommentLike(commentId);
          applyCommentMetrics(commentId, response, {
            likes: nextLikes,
            dislikes: nextDislikes,
          });
        }
      } catch (error) {
        setCommentReactions((previous) => ({
          ...previous,
          [commentId]: { liked: previousState.liked, disliked: previousState.disliked },
        }));
        applyCommentMetrics(commentId, undefined, {
          likes: previousState.likes,
          dislikes: previousState.dislikes,
        });
        toast.error("Не удалось обновить реакцию на комментарий. Попробуйте ещё раз.");
      } finally {
        setReactionPendingByComment((previous) => ({ ...previous, [commentId]: false }));
      }
    },
    [applyCommentMetrics, commentReactions, comments, reactionPendingByComment]
  );

  const handleCommentDislike = useCallback(
    async (commentId: string) => {
      if (reactionPendingByComment[commentId]) {
        return;
      }

      const comment = comments.find((item) => item.id === commentId);

      if (!comment) {
        return;
      }

      const reaction = commentReactions[commentId] ?? { liked: false, disliked: false };

      setReactionPendingByComment((previous) => ({ ...previous, [commentId]: true }));

      const previousState = {
        liked: reaction.liked,
        disliked: reaction.disliked,
        likes: comment.likeCount,
        dislikes: comment.dislikeCount,
      };

      try {
        if (reaction.disliked) {
          setCommentReactions((previous) => ({ ...previous, [commentId]: { liked: false, disliked: false } }));
          const nextDislikes = Math.max(0, comment.dislikeCount - 1);
          applyCommentMetrics(commentId, undefined, {
            likes: comment.likeCount,
            dislikes: nextDislikes,
          });
          const response = await clearCommentReaction(commentId);
          applyCommentMetrics(commentId, response, {
            likes: comment.likeCount,
            dislikes: nextDislikes,
          });
        } else {
          const nextDislikes = comment.dislikeCount + 1;
          const nextLikes = reaction.liked ? Math.max(0, comment.likeCount - 1) : comment.likeCount;
          setCommentReactions((previous) => ({ ...previous, [commentId]: { liked: false, disliked: true } }));
          applyCommentMetrics(commentId, undefined, {
            likes: nextLikes,
            dislikes: nextDislikes,
          });
          const response = await sendCommentDislike(commentId);
          applyCommentMetrics(commentId, response, {
            likes: nextLikes,
            dislikes: nextDislikes,
          });
        }
      } catch (error) {
        setCommentReactions((previous) => ({
          ...previous,
          [commentId]: { liked: previousState.liked, disliked: previousState.disliked },
        }));
        applyCommentMetrics(commentId, undefined, {
          likes: previousState.likes,
          dislikes: previousState.dislikes,
        });
        toast.error("Не удалось обновить реакцию на комментарий. Попробуйте ещё раз.");
      } finally {
        setReactionPendingByComment((previous) => ({ ...previous, [commentId]: false }));
      }
    },
    [applyCommentMetrics, commentReactions, comments, reactionPendingByComment]
  );

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }

    return num.toString();
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = postData?.title || "Публикация YoungWings";

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
        break;
      case "instagram":
        toast.info("Instagram не поддерживает прямое шаринг. Скопируйте ссылку!");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        break;
      case "telegram":
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
        break;
      case "tiktok":
        toast.info("TikTok не поддерживает прямое шаринг. Скопируйте ссылку!");
        break;
      case "threads":
        window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(text + " " + url)}`, "_blank");
        break;
      case "copy":
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
            toast.success("Ссылка скопирована!");
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = url;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
              document.execCommand("copy");
              toast.success("Ссылка скопирована!");
            } catch (err) {
              toast.error("Не удалось скопировать ссылку");
            }
            document.body.removeChild(textArea);
          }
        } catch (err) {
          toast.error("Не удалось скопировать. URL: " + url);
        }
        break;
    }
  };

  const handleAddComment = useCallback(async () => {
    if (!postData?.id) {
      toast.error("Не удалось определить публикацию для комментария");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Пожалуйста, введите комментарий");
      return;
    }

    if (!isAnonymous && (!firstName.trim() || !lastName.trim())) {
      toast.error("Пожалуйста, введите имя и фамилию");
      return;
    }

    const payload = {
      text: newComment.trim(),
      name: isAnonymous ? null : firstName.trim() || null,
      surname: isAnonymous ? null : lastName.trim() || null,
    };

    const nextTotal = commentCount + 1;

    setIsSubmittingComment(true);

    try {
      await createComment(postData.id, payload);

      toast.success("Комментарий добавлен!");
      setNewComment("");
      setFirstName("");
      setLastName("");
      setIsAnonymous(false);
      setCommentCount(nextTotal);

      if (onPostUpdate) {
        onPostUpdate(postData.id, { comments: nextTotal });
      }

      await loadComments({ page: 1 });
    } catch (error) {
      toast.error("Не удалось добавить комментарий. Попробуйте ещё раз.");
    } finally {
      setIsSubmittingComment(false);
    }
  }, [commentCount, firstName, isAnonymous, lastName, loadComments, newComment, onPostUpdate, postData?.id]);

  return (
    <div className="space-y-3 sm:space-y-6 lg:pt-6 pt-1">
      <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Назад
      </Button>

      <article className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 pb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">YW</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900 mb-0.5">YoungWings</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{postData?.category || "Технологии"}</span>
                <span>·</span>
                <span>{postData?.date || "15 октября 2025"}</span>
              </div>
            </div>
          </div>

          <h1 className="mb-4">
            {postData?.title || "Искусственный интеллект меняет мир: главные тренды 2025 года"}
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {postData?.excerpt ||
              "Эксперты прогнозируют революционные изменения в технологической индустрии. Искусственный интеллект становится основным драйвером инноваций во всех сферах жизни."}
          </p>
        </div>

        {postData?.image && (
          <div className="px-5 pb-4">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
              <ImageWithFallback
                src={postData.image}
                alt={postData.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="px-5 pb-4 space-y-4">
          {postData?.content ? (
            <TipTapContent content={postData.content} className="space-y-4" />
          ) : postData?.excerpt ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{postData.excerpt}</p>
          ) : null}
        </div>

        <div className="px-5 pb-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isReactionPending}
                className={`gap-1 h-8 px-1.5 sm:px-2 hover:bg-primary/5 ${
                  isLiked ? "text-blue-600 hover:text-blue-700" : "hover:text-primary"
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-blue-600" : ""}`} />
                <span className="text-sm">{likeCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDislike}
                disabled={isReactionPending}
                className={`gap-1 h-8 px-1.5 sm:px-2 hover:bg-primary/5 ${
                  isDisliked ? "text-red-600 hover:text-red-700" : "hover:text-primary"
                }`}
              >
                <ThumbsDown className={`w-4 h-4 ${isDisliked ? "fill-red-600" : ""}`} />
                <span className="text-sm">{dislikeCount}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments((value) => !value)}
                className="gap-1 h-8 px-1.5 sm:px-2 hover:text-primary hover:bg-primary/5"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{commentCount}</span>
              </Button>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{formatNumber(viewCount)}</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 h-8 px-1.5 sm:px-2 hover:text-primary hover:bg-primary/5">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-9 justify-start gap-2"
                      onClick={() => handleShare("whatsapp")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M20.52 3.48A11.82 11.82 0 0 0 12 0C5.38 0 0 5.27 0 11.77a11.62 11.62 0 0 0 1.62 5.91L0 24l6.51-1.7a12 12 0 0 0 5.49 1.35h.01c6.62 0 12-5.27 12-11.77 0-3.15-1.37-6.11-3.48-8.35m-8.54 18.3h-.01a9.96 9.96 0 0 1-5.07-1.38l-.36-.21-3.86 1.01 1.03-3.64-.24-.37a9.74 9.74 0 0 1-1.51-5.22c0-5.42 4.52-9.83 10.07-9.83 2.7 0 5.24 1.05 7.15 2.94a9.9 9.9 0 0 1 2.97 7.11c0 5.41-4.52 9.82-10.17 9.82m5.5-7.39c-.3-.15-1.78-.88-2.05-.98-.27-.1-.46-.15-.66.15s-.76.98-.93 1.18-.34.22-.63.07a8.2 8.2 0 0 1-4.29-3.73c-.32-.55.32-.5.91-1.67.1-.2.05-.37-.02-.52-.07-.15-.66-1.58-.91-2.16-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.48s1.08 2.88 1.23 3.08c.15.2 2.13 3.25 5.16 4.55.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.13-.29-.2-.59-.35" />
                      </svg>
                      <span className="text-xs">WhatsApp</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-9 justify-start gap-2"
                      onClick={() => handleShare("telegram")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="m9.51 15.44-.39 5.5c.56 0 .8-.24 1.09-.52l2.62-2.5 5.43 3.95c.99.54 1.69.26 1.95-.91L24 4.46c.32-1.3-.47-1.81-1.34-1.5L1.12 10.8C-.13 11.3-.11 12.02.9 12.33l5.53 1.72 12.8-8.06c.6-.38 1.15-.17.7.21" />
                      </svg>
                      <span className="text-xs">Telegram</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-9 justify-start gap-2"
                      onClick={() => handleShare("twitter")}
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="text-xs">Twitter</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-9 justify-start gap-2"
                      onClick={() => handleShare("facebook")}
                    >
                      <Facebook className="w-4 h-4" />
                      <span className="text-xs">Facebook</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-9 justify-start gap-2"
                      onClick={() => handleShare("threads")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                        <path d="M12.09 24c5.08 0 8.97-2.5 10.56-6.66.59-1.54.78-3.15.57-4.73-.17-1.25-.52-2.41-1.03-3.43-.65-1.27-1.54-2.37-2.67-3.27a9.74 9.74 0 0 0-3.29-1.75c-.19-.05-.35-.1-.45-.13A5.9 5.9 0 0 0 14.03.38C13.07.13 12.08 0 11.03 0h-.1C5.19.03.59 4.39.31 9.93c-.17 3.48 1.28 6.78 3.79 8.96 2.27 1.96 5.3 3.01 8.36 3.01zm.22-2.18h-.15c-2.47 0-4.83-.8-6.6-2.25-2.03-1.71-3.13-4.27-2.99-7.11.19-4.1 3.65-7.47 7.77-7.47h.06c.79 0 1.54.1 2.24.29.66.18 1.24.5 1.76.94.53.45.93 1.03 1.22 1.74.28.64.46 1.41.55 2.28.09.86.08 1.83-.03 2.86a8.52 8.52 0 0 0-.21 2.14c.02.66.14 1.31.36 1.93.27.78.68 1.4 1.21 1.83.5.41.98.62 1.4.62.41 0 .72-.23.93-.7.21-.5.27-1.07.18-1.69-.07-.5-.23-1-.48-1.5-.27-.53-.64-1.04-1.1-1.5-.45-.46-.96-.81-1.5-1.04-.52-.22-1.06-.34-1.6-.34-.78 0-1.5.27-2.17.8-.62.5-1.08 1.1-1.35 1.78-.27.66-.42 1.36-.45 2.1-.01.57.07 1.08.24 1.54.16.4.4.73.71.98.32.26.7.39 1.13.39.43 0 .81-.12 1.14-.37.33-.25.6-.62.79-1.08.2-.47.31-1.03.33-1.68.03-.89-.08-1.68-.33-2.34-.26-.68-.67-1.26-1.19-1.7-.53-.46-1.2-.69-1.94-.69-.78 0-1.45.22-2 .66-.55.43-.95 1-1.2 1.68a5.62 5.62 0 0 0-.36 2.11c.03.86.22 1.66.57 2.36.34.68.8 1.23 1.36 1.62.57.39 1.22.6 1.9.6h.02c1.16 0 2.08-.33 2.72-.97.43-.44.76-.98.97-1.6a7.9 7.9 0 0 0 .46-2.34c.01-.4-.02-.79-.09-1.15-.1-.6-.3-1.14-.58-1.6-.28-.46-.66-.84-1.1-1.12-.46-.29-.98-.44-1.55-.44-.72 0-1.39.2-1.97.6-.58.4-1.03.94-1.33 1.6-.3.66-.44 1.38-.42 2.15.01.39.09.78.22 1.16.13.37.33.7.58.98.25.26.55.4.89.4.35 0 .63-.11.85-.34.23-.23.41-.55.53-.93.13-.41.19-.88.19-1.41-.01-.56-.1-1.03-.28-1.43-.17-.38-.4-.69-.7-.91-.31-.22-.67-.33-1.07-.33-.4 0-.75.12-1.05.35-.3.23-.53.54-.69.92-.16.37-.24.8-.23 1.28.01.46.09.87.23 1.22.14.35.34.63.61.83.26.2.58.3.95.3.37 0 .69-.11.96-.34.27-.22.49-.54.64-.94.16-.43.24-.92.25-1.47.02-.83-.13-1.54-.44-2.08-.3-.53-.72-.93-1.24-1.2-.53-.28-1.15-.42-1.86-.42-1 0-1.84.29-2.5.85-.66.56-1.1 1.3-1.31 2.18-.2.86-.23 1.8-.09 2.79.14.98.47 1.82.97 2.48.5.66 1.18 1.17 2.01 1.52.84.36 1.86.54 3.03.54" />
                      </svg>
                      <span className="text-xs">Threads</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-9 justify-start gap-2"
                      onClick={() => handleShare("copy")}
                    >
                      <Link2 className="w-4 h-4" />
                      <span className="text-xs">Скопировать ссылку</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {showComments && (
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm">Комментарии ({commentCount})</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(false)}
                className="text-sm h-8 px-2 hover:text-primary hover:bg-primary/5"
              >
                Свернуть
              </Button>
            </div>

            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(Boolean(checked))}
                  disabled={isSubmittingComment}
                />
                <label htmlFor="anonymous" className="text-sm cursor-pointer">
                  Анонимно
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Имя"
                    className="text-sm"
                    disabled={isSubmittingComment}
                  />
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Фамилия"
                    className="text-sm"
                    disabled={isSubmittingComment}
                  />
                </div>
              )}

              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Написать комментарий..."
                className="resize-none"
                rows={2}
                disabled={isSubmittingComment}
              />
              <Button size="sm" className="w-full" onClick={handleAddComment} disabled={isSubmittingComment}>
                {isSubmittingComment ? "Отправка..." : "Отправить"}
              </Button>
            </div>

            <div className="space-y-3">
              {isCommentsLoading && comments.length === 0 && (
                <div className="text-sm text-muted-foreground">Загрузка комментариев...</div>
              )}

              {commentsError && comments.length === 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-red-500">{commentsError}</div>
                  <Button variant="outline" size="sm" onClick={() => loadComments({ page: 1 })}>
                    Попробовать снова
                  </Button>
                </div>
              )}

              {comments.map((comment) => {
                const reaction = commentReactions[comment.id] ?? { liked: false, disliked: false };
                const isPending = reactionPendingByComment[comment.id] === true;

                return (
                  <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-100">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm">{getCommentAuthor(comment.authorName)}</span>
                      <span className="text-xs text-muted-foreground">{getCommentDisplayDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{comment.content}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentLike(comment.id)}
                        disabled={isPending}
                        className={`gap-1.5 h-7 px-2 text-xs ${
                          reaction.liked ? "text-blue-600 hover:text-blue-700" : "hover:text-primary"
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${reaction.liked ? "fill-blue-600" : ""}`} />
                        <span>{comment.likeCount ?? 0}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentDislike(comment.id)}
                        disabled={isPending}
                        className={`gap-1.5 h-7 px-2 text-xs ${
                          reaction.disliked ? "text-red-600 hover:text-red-700" : "hover:text-primary"
                        }`}
                      >
                        <ThumbsDown className={`w-3 h-3 ${reaction.disliked ? "fill-red-600" : ""}`} />
                        <span>{comment.dislikeCount ?? 0}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}

              {hasMoreComments && !isCommentsLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 hover:text-primary hover:bg-primary/5"
                  onClick={() => loadComments({ page: commentsPage + 1, append: true })}
                >
                  Показать ещё
                </Button>
              )}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
