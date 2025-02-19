import { SearchResult } from './types';

const VECTOR_SEARCH_API_URL = process.env.VECTOR_SEARCH_API_URL;

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
  limit = 144,
  certainty_threshold = 0.5,
  exact_match_threshold = 0.95,
  similarity_weight = 0.6,
  recency_weight = 0.2,
  source_weight = 0.2,
  include_vectors = false,
}: SearchParams): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    certainty_threshold: certainty_threshold.toString(),
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
    certainty_threshold: params.certainty_threshold?.toString() || '0.5',
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