export interface TranslatorResponse {
  id: string;
  fullName: string;
  languages?: string | null;
  specialization?: string | null;
  experience?: string | null;
  location?: string | null;
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
