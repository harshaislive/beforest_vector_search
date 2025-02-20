export interface SearchResult {
  dropbox_path: string;
  source_csv: string;
  modified_date: string;
  thumbnail_url: string | null;
  similarity_score: number;
  exact_match: boolean;
  vector_distance: number | null;
  source_weight: number;
  recency_score: number;
  combined_score: number;
}

export interface CachedImage {
  previewUrl: string;
  downloadUrl: string;
} 