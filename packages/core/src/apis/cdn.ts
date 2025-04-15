import type { KyResponse, Options } from 'ky';
import ky from 'ky';

export interface GetCdnFileRequestSchema {
  url: string;
}
export interface GetCdnFileSuccessSchema {
  response: KyResponse;
  blob: Blob;
  headers: Record<PropertyKey, string>;
}
export type CdnValidKeys = (typeof cdnValidKeys)[keyof typeof cdnValidKeys];

export const cdnValidKeys = {
  getArticleCoverImage: 'getArticleCoverImage',
} as const;

export const cdnKeys = {
  all: ['cdn'] as const,
  article: () => [...cdnKeys.all, 'article'] as const,
  getArticleCoverImage: (url: string | undefined) =>
    [...cdnKeys.article(), url] as const,
};

export function cdnRepositories() {
  return {
    /**
     * @access public
     * @url GET ${env.apiBaseUrl}/${url}
     * @throws HTTPError | TimeoutError | ZodError
     */
    async getCdnFile({ url }: { url: string }, options?: Options) {
      const response = await ky.get(url, options);
      const blob = await response.blob();
      const headers = Object.fromEntries(response.headers);

      return {
        response,
        blob,
        headers,
      };
    },
  } as const;
}
