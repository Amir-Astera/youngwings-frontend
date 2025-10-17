export interface CommentResponse {
  id: string;
  authorName: string | null;
  content: string;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
}

export interface CommentListResponse {
  total: number;
  page: number;
  size: number;
  items: CommentResponse[];
}

export interface CreateCommentRequest {
  text: string;
  name: string | null;
  surname: string | null;
}
