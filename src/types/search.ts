export type SearchKind = "POST" | "EVENT" | "TOPIC";

export interface SearchResultBase {
  id?: string;
  kind: SearchKind;
  score?: number;
  createdAt?: string | null;
  snippet?: string | null;
}

export interface SearchResultPost extends SearchResultBase {
  kind: "POST";
  title?: string | null;
  description?: string | null;
  topic?: string | null;
  chapter?: string | null;
  thumbnail?: string | null;
  likeCount?: number | null;
  viewCount?: number | null;
  commentCount?: number | null;
  author?: string | null;
}

export interface SearchResultEvent extends SearchResultBase {
  kind: "EVENT";
  title?: string | null;
  description?: string | null;
  location?: string | null;
  region?: string | null;
  sphere?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  coverUrl?: string | null;
}

export interface SearchResultTopic extends SearchResultBase {
  kind: "TOPIC";
  topic: string;
  title?: string | null;
  postCount?: number | null;
}

export type SearchResultItem =
  | SearchResultPost
  | SearchResultEvent
  | SearchResultTopic;

export interface SearchResponse {
  total: number;
  page: number;
  size: number;
  items: SearchResultItem[];
}
