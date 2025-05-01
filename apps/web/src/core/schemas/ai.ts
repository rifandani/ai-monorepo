import type { LanguageModelV1Source } from '@ai-sdk/provider';
import { z } from 'zod';

// type MessagePart = IterableElement<Message['parts']>;
export type Research = {
  learnings: string[];
  sources: SearchResult[];
  questionsExplored: string[];
  searchQueries: string[];
};
export type MetadataAnnotation = {
  type: 'metadata';
  data: {
    duration: number; // in milliseconds
  };
};
export type DeepResearchAnnotation = {
  type: 'deep-research';
  data: {
    status?: string;
    source?: Pick<LanguageModelV1Source, 'title' | 'url'>;
  };
};
export type WebSearchAnnotation = {
  type: 'web-search';
  data: {
    source: LanguageModelV1Source;
  };
};
export type Annotation =
  | MetadataAnnotation
  | WebSearchAnnotation
  | DeepResearchAnnotation;

export const searchResultSchema = z.object({
  title: z.string().describe('The title of the search result'),
  content: z.string().describe('The content of the search result'),
  url: z.string().describe('The url of the search result source'),
  publishedDate: z
    .string()
    .datetime()
    .describe('The date the search result was published'),
});
export type SearchResult = z.infer<typeof searchResultSchema>;
