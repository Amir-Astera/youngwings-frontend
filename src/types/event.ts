export interface EventResponse {
  id: string;
  title: string;
  description?: string;
  eventDate?: string;
  eventTime?: string;
  location?: string;
  format?: string;
  region?: string;
  sphere?: string;
  coverUrl?: string | null;
  registrationUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventListResponse {
  total: number;
  page: number;
  size: number;
  items: EventResponse[];
}
