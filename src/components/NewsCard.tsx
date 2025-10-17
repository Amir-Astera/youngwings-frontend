import { useCallback, useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, Share2, Eye, ChevronDown, MessageSquare, Twitter, Facebook, Link2 } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner@2.0.3";
import placeholderImage from "../assets/news-placeholder.svg";
import { TipTapContent } from "./TipTapContent";
import { clearPostReaction, registerPostView, sendPostDislike, sendPostLike } from "../lib/api";
import { hasViewBeenRecorded, markViewRecorded } from "../lib/clientState";
import type { PostResponse } from "../types/post";

interface NewsCardProps {
  id: string;
  title: string;
  excerpt: string;
  content?: string | null;
  image?: string | null;
  category: string;
  date: string;
  likes: number;
  dislikes: number;
  comments: number;
  views: number;
  isAd?: boolean;
  onViewPost?: () => void;
  onPostUpdate?: (postId: string, metrics: { likes?: number; dislikes?: number; views?: number }) => void;
}

export function NewsCard({
  id,
  title,
  excerpt,
  content,
  image,
  category,
  date,
  likes,
  dislikes,
  comments,
  views,
  onViewPost,
  onPostUpdate,
}: NewsCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [dislikeCount, setDislikeCount] = useState(dislikes);
  const [viewCount, setViewCount] = useState(views);
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [newComment, setNewComment] = useState("");
  const [isReactionPending, setIsReactionPending] = useState(false);
  const [isViewPending, setIsViewPending] = useState(false);
  const [hasRegisteredView, setHasRegisteredView] = useState(() => hasViewBeenRecorded(id));

  const [commentReactions, setCommentReactions] = useState<{[key: number]: {liked: boolean, disliked: boolean, likes: number, dislikes: number}}>({
    1: { liked: false, disliked: false, likes: 12, dislikes: 2 },
    2: { liked: false, disliked: false, likes: 8, dislikes: 1 },
    3: { liked: false, disliked: false, likes: 15, dislikes: 3 },
    4: { liked: false, disliked: false, likes: 6, dislikes: 0 },
    5: { liked: false, disliked: false, likes: 9, dislikes: 1 },
  });

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

      if (onPostUpdate && Object.keys(metrics).length > 0) {
        onPostUpdate(id, metrics);
      }

      return metrics;
    },
    [id, onPostUpdate]
  );

  const handleLike = useCallback(async () => {
    if (isReactionPending) {
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
        const response = await clearPostReaction(id);
        applyMetrics(response, { likes: nextLikes, dislikes: previous.dislikeCount });
      } else {
        setIsLiked(true);
        setLikeCount((value) => value + 1);

        if (isDisliked) {
          setIsDisliked(false);
          setDislikeCount((value) => Math.max(0, value - 1));
        }

        const response = await sendPostLike(id);
        const nextLikes = previous.likeCount + 1;
        const nextDislikes = isDisliked ? Math.max(0, previous.dislikeCount - 1) : previous.dislikeCount;
        applyMetrics(response, {
          likes: nextLikes,
          dislikes: nextDislikes,
        });
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
  }, [applyMetrics, id, isDisliked, isLiked, isReactionPending, likeCount, dislikeCount]);

  const handleDislike = useCallback(async () => {
    if (isReactionPending) {
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
        const response = await clearPostReaction(id);
        applyMetrics(response, { dislikes: nextDislikes, likes: previous.likeCount });
      } else {
        setIsDisliked(true);
        setDislikeCount((value) => value + 1);

        if (isLiked) {
          setIsLiked(false);
          setLikeCount((value) => Math.max(0, value - 1));
        }

        const response = await sendPostDislike(id);
        const nextDislikes = previous.dislikeCount + 1;
        const nextLikes = isLiked ? Math.max(0, previous.likeCount - 1) : previous.likeCount;
        applyMetrics(response, {
          dislikes: nextDislikes,
          likes: nextLikes,
        });
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
  }, [applyMetrics, id, isDisliked, isLiked, isReactionPending, likeCount, dislikeCount]);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);

    if (hasRegisteredView || isViewPending) {
      return;
    }

    setIsViewPending(true);
    const previous = viewCount;
    setViewCount((value) => value + 1);

    registerPostView(id)
      .then((response) => {
        markViewRecorded(id);
        setHasRegisteredView(true);
        applyMetrics(response, { views: previous + 1 });
      })
      .catch(() => {
        setViewCount(previous);
        toast.error("Не удалось отметить просмотр. Попробуйте ещё раз.");
      })
      .finally(() => {
        setIsViewPending(false);
      });
  }, [applyMetrics, hasRegisteredView, id, isViewPending, viewCount]);

  useEffect(() => {
    setLikeCount(likes);
  }, [likes]);

  useEffect(() => {
    setDislikeCount(dislikes);
  }, [dislikes]);

  useEffect(() => {
    setViewCount(views);
  }, [views]);

  useEffect(() => {
    setHasRegisteredView(hasViewBeenRecorded(id));
  }, [id]);

  const handleCommentLike = (commentId: number) => {
    setCommentReactions(prev => {
      const current = prev[commentId];
      const newState = { ...prev };
      
      if (current.liked) {
        newState[commentId] = { ...current, liked: false, likes: current.likes - 1 };
      } else {
        if (current.disliked) {
          newState[commentId] = { ...current, disliked: false, dislikes: current.dislikes - 1, liked: true, likes: current.likes + 1 };
        } else {
          newState[commentId] = { ...current, liked: true, likes: current.likes + 1 };
        }
      }
      return newState;
    });
  };

  const handleCommentDislike = (commentId: number) => {
    setCommentReactions(prev => {
      const current = prev[commentId];
      const newState = { ...prev };
      
      if (current.disliked) {
        newState[commentId] = { ...current, disliked: false, dislikes: current.dislikes - 1 };
      } else {
        if (current.liked) {
          newState[commentId] = { ...current, liked: false, likes: current.likes - 1, disliked: true, dislikes: current.dislikes + 1 };
        } else {
          newState[commentId] = { ...current, disliked: true, dislikes: current.dislikes + 1 };
        }
      }
      return newState;
    });
  };

  // Format number to K format (1000 -> 1K)
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = title;
    
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
          // Try modern clipboard API first
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
            toast.success("Ссылка скопирована!");
          } else {
            // Fallback method for older browsers or restricted contexts
            const textArea = document.createElement("textarea");
            textArea.value = url;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
              document.execCommand('copy');
              toast.success("Ссылка скопирована!");
            } catch (err) {
              toast.error("Не удалось скопировать ссылку");
            }
            document.body.removeChild(textArea);
          }
        } catch (err) {
          // If all else fails, show the URL
          toast.error("Не удалось скопировать. URL: " + url);
        }
        break;
    }
  };

  const mockComments = [
    {
      id: 1,
      author: "Алексей К.",
      text: "Очень интересная статья! Спасибо за информацию.",
      date: "2 часа назад",
    },
    {
      id: 2,
      author: "Мария С.",
      text: "Согласна с автором. Эта тема действительно актуальна сейчас.",
      date: "3 часа назад",
    },
    {
      id: 3,
      author: "Дмитрий П.",
      text: "Хотелось бы увидеть больше примеров из практики.",
      date: "5 часов назад",
    },
    {
      id: 4,
      author: "Анна М.",
      text: "Отличный материал для изучения темы!",
      date: "1 день назад",
    },
    {
      id: 5,
      author: "Игорь Р.",
      text: "Буду ждать продолжения этой серии статей.",
      date: "1 день назад",
    },
  ];

  const commentsPerPage = 3;
  const startIndex = (currentPage - 1) * commentsPerPage;
  const endIndex = startIndex + commentsPerPage;
  const currentComments = mockComments.slice(startIndex, endIndex);
  const totalPages = Math.ceil(mockComments.length / commentsPerPage);

  return (
    <article className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">YW</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-900 mb-0.5">YoungWings</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{category}</span>
              <span>·</span>
              <span>{date}</span>
            </div>
          </div>
        </div>

        <h3
          className="mb-3 hover:text-primary transition-colors cursor-pointer font-semibold"
          onClick={() => onViewPost?.()}
        >
          {title}
        </h3>

        <p className={`text-sm text-muted-foreground leading-relaxed ${!isExpanded && "line-clamp-3"}`}>
          {excerpt}
        </p>
      </div>

      {/* Image */}
      <div className="px-5 pb-4">
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
          <ImageWithFallback
            src={image && image.trim() !== "" ? image : placeholderImage}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      {/* Show Full Button */}
      {!isExpanded && (
        <div className="px-5 pb-4">
          <button
            onClick={handleExpand}
            className="text-sm text-primary hover:underline"
          >
            Показать полностью
          </button>
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-4 space-y-4">
          {content ? (
            <TipTapContent content={content} className="space-y-4" />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{excerpt}</p>
          )}

          <button onClick={() => setIsExpanded(false)} className="text-sm text-primary hover:underline">
            Свернуть
          </button>
        </div>
      )}
      {/* Footer */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between gap-2">
          {/* Actions row: likes, dislikes, comments, views, share */}
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
              onClick={() => setShowComments(!showComments)}
              className="gap-1 h-8 px-1.5 sm:px-2 hover:text-primary hover:bg-primary/5"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{comments}</span>
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
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#25D366"/>
                    </svg>
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 justify-start gap-2"
                    onClick={() => handleShare("instagram")}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#instagram-gradient)"/>
                      <defs>
                        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#FD5949"/>
                          <stop offset="50%" stopColor="#D6249F"/>
                          <stop offset="100%" stopColor="#285AEB"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="text-xs">Instagram</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 justify-start gap-2"
                    onClick={() => handleShare("twitter")}
                  >
                    <Twitter className="w-4 h-4 text-blue-400" />
                    <span className="text-xs">Twitter</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 justify-start gap-2"
                    onClick={() => handleShare("facebook")}
                  >
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <span className="text-xs">Facebook</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 justify-start gap-2"
                    onClick={() => handleShare("telegram")}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" fill="#0088cc"/>
                    </svg>
                    <span className="text-xs">Telegram</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 justify-start gap-2"
                    onClick={() => handleShare("tiktok")}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="text-xs">TikTok</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-9 justify-start gap-2"
                    onClick={() => handleShare("threads")}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.579.877-6.433 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192-.12-.382-.223-.573-.318-.31 1.43-.857 2.657-1.627 3.65-1.194 1.54-2.87 2.318-4.986 2.318-1.373 0-2.508-.407-3.376-1.21-.89-.823-1.337-1.912-1.337-3.241 0-1.454.537-2.664 1.596-3.598 1.06-.935 2.474-1.41 4.205-1.41.96 0 1.857.14 2.664.42.328-1.112.537-2.344.623-3.668C13.262 6.04 12.65 6 12 6c-3.037 0-5.5 2.463-5.5 5.5S8.963 17 12 17c1.66 0 3.144-.736 4.156-1.898.507-.582.898-1.273 1.156-2.05.387.176.764.384 1.125.623 1.288.852 2.152 2.011 2.57 3.446.673 2.311.016 5.138-1.743 7.514-1.442 1.95-3.564 2.945-6.316 2.961l-.178.004z"/>
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

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm">Комментарии ({mockComments.length})</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(false)}
              className="text-sm h-8 px-2 hover:text-primary hover:bg-primary/5"
            >
              Свернуть
            </Button>
          </div>
          
          {/* New Comment Input */}
          <div className="mb-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написать комментарий..."
              className="resize-none mb-2"
              rows={2}
            />
            <Button size="sm" className="w-full">Отправить</Button>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {currentComments.map((comment) => (
              <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-100">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">{comment.date}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCommentLike(comment.id)}
                    className={`gap-1.5 h-7 px-2 text-xs ${
                      commentReactions[comment.id]?.liked
                        ? "text-blue-600 hover:text-blue-700"
                        : "hover:text-primary"
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${commentReactions[comment.id]?.liked ? "fill-blue-600" : ""}`} />
                    <span>{commentReactions[comment.id]?.likes || 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCommentDislike(comment.id)}
                    className={`gap-1.5 h-7 px-2 text-xs ${
                      commentReactions[comment.id]?.disliked
                        ? "text-red-600 hover:text-red-700"
                        : "hover:text-primary"
                    }`}
                  >
                    <ThumbsDown className={`w-3 h-3 ${commentReactions[comment.id]?.disliked ? "fill-red-600" : ""}`} />
                    <span>{commentReactions[comment.id]?.dislikes || 0}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Далее
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
