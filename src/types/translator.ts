export interface TranslatorResponse {
  id: string;
  fullName: string;
  languages?: string | null;
  specialization?: string | null;
  experience?: string | null;
  location?: string | null;
  region?: string | null;
  status?: string | null;
  format?: string | null;
  eventName?: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  eventDateFrom?: string | null;
  eventDateTo?: string | null;
  eventDate?: string | null;
  photoUrl?: string | null;
  qrUrl?: string | null;
  nickname?: string | null;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TranslatorListResponse {
  total: number;
  page: number;
  size: number;
  items: TranslatorResponse[];
}
