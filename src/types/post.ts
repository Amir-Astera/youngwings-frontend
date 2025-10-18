export interface PostResponse {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  chapter: string;
  topic: string;
  author: string;
  content: string;
  commentCount: number;
  likeCount: number;
  dislikeCount: number;
  viewCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostListResponse {
  total: number;
  page: number;
  size: number;
  items: PostResponse[];
}

export interface PostCountersUpdate {
  id?: string;
  postId?: string;
  likeCount?: number;
  dislikeCount?: number;
  viewCount?: number;
  commentCount?: number;
}

export interface PostCountersState {
  likes: number;
  dislikes: number;
  views: number;
  comments: number;
}

export type PostReactionType = "like" | "dislike";

export interface PostMyState {
  id?: string;
  postId?: string;
  myReaction?: PostReactionType | null;
  reaction?: PostReactionType | null;
  liked?: boolean;
  disliked?: boolean;
  viewed?: boolean;
  hasViewed?: boolean;
}

export interface PostPersonalState {
  reaction?: PostReactionType | null;
  viewed?: boolean;
}

export interface PostSummary {
  id: string;
  title: string;
  excerpt: string;
  image?: string | null;
  category: string;
  date: string;
  likes: number;
  dislikes: number;
  comments: number;
  views: number;
  author?: string;
  topic?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  raw?: PostResponse;
  myReaction?: PostReactionType | null;
  hasViewed?: boolean;
}
