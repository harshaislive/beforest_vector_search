import { SearchResult } from './types';

const VECTOR_SEARCH_API_URL = process.env.VECTOR_SEARCH_API_URL as string;

// Default values for search parameters
const DEFAULT_CERTAINTY_THRESHOLD = 0.5;
const DEFAULT_EXACT_MATCH_THRESHOLD = 0.95;
const DEFAULT_SIMILARITY_WEIGHT = 0.6;
const DEFAULT_RECENCY_WEIGHT = 0.2;
const DEFAULT_SOURCE_WEIGHT = 0.2;
const DEFAULT_INCLUDE_VECTORS = false;

if (!VECTOR_SEARCH_API_URL) {
  throw new Error('Missing Vector Search API URL configuration');
}

interface SearchParams {
  query?: string;
  limit?: number;
  certainty_threshold?: number;
  exact_match_threshold?: number;
  similarity_weight?: number;
  recency_weight?: number;
  source_weight?: number;
  include_vectors?: boolean;
}

export async function searchImages({
  query,
  limit = parseInt(process.env.NEXT_PUBLIC_MAX_RESULTS || '144'),
  certainty_threshold,
  exact_match_threshold = parseFloat(process.env.VECTOR_SEARCH_EXACT_MATCH_THRESHOLD || DEFAULT_EXACT_MATCH_THRESHOLD.toString()),
  similarity_weight = parseFloat(process.env.VECTOR_SEARCH_SIMILARITY_WEIGHT || DEFAULT_SIMILARITY_WEIGHT.toString()),
  recency_weight = parseFloat(process.env.VECTOR_SEARCH_RECENCY_WEIGHT || DEFAULT_RECENCY_WEIGHT.toString()),
  source_weight = parseFloat(process.env.VECTOR_SEARCH_SOURCE_WEIGHT || DEFAULT_SOURCE_WEIGHT.toString()),
  include_vectors = process.env.VECTOR_SEARCH_INCLUDE_VECTORS === 'true' || DEFAULT_INCLUDE_VECTORS,
}: SearchParams): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    certainty_threshold: certainty_threshold?.toString() || process.env.VECTOR_SEARCH_CERTAINTY_THRESHOLD || DEFAULT_CERTAINTY_THRESHOLD.toString(),
    exact_match_threshold: exact_match_threshold.toString(),
    similarity_weight: similarity_weight.toString(),
    recency_weight: recency_weight.toString(),
    source_weight: source_weight.toString(),
    include_vectors: include_vectors.toString(),
  });

  try {
    if (query) {
      // Text-based search
      const response = await fetch(`${VECTOR_SEARCH_API_URL}?${params.toString()}&query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Search API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as SearchResult[];
    }
    throw new Error('Either query or image file must be provided');
  } catch (error) {
    console.error('Error searching images:', error);
    throw error;
  }
}

export async function searchByImage(
  file: File | Blob,
  params: Omit<SearchParams, 'query'>
): Promise<SearchResult[]> {
  const formData = new FormData();
  formData.append('file', file);

  const searchParams = new URLSearchParams({
    limit: params.limit?.toString() || '144',
    certainty_threshold: params.certainty_threshold?.toString() || process.env.VECTOR_SEARCH_CERTAINTY_THRESHOLD || DEFAULT_CERTAINTY_THRESHOLD.toString(),
    exact_match_threshold: params.exact_match_threshold?.toString() || '0.95',
    similarity_weight: params.similarity_weight?.toString() || '0.6',
    recency_weight: params.recency_weight?.toString() || '0.2',
    source_weight: params.source_weight?.toString() || '0.2',
    include_vectors: params.include_vectors?.toString() || 'false',
  });

  try {
    const response = await fetch(
      `${VECTOR_SEARCH_API_URL.replace('/text', '/image')}?${searchParams.toString()}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as SearchResult[];
  } catch (error) {
    console.error('Error searching by image:', error);
    throw error;
  }
} 