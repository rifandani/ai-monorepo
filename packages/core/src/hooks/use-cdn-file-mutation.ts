import type { MutationState, UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useMutationState } from '@tanstack/react-query';
import type {
  CdnValidKeys,
  GetCdnFileSuccessSchema,
} from '@workspace/core/apis/cdn';
import { cdnKeys, cdnRepositories } from '@workspace/core/apis/cdn';
import type { HTTPError } from 'ky';
import { toast } from 'sonner';
import type { Except } from 'type-fest';

interface Opt {
  key: CdnValidKeys;
  url?: string | undefined;
}

/**
 * Lazily download file based on input url.
 *
 * Includes error handling in `onError` for convenience.
 */
export function useCdnFileMutation(
  opt: Opt,
  mutationOptions?: Except<
    UseMutationOptions<GetCdnFileSuccessSchema, HTTPError, string>,
    'mutationKey' | 'mutationFn'
  >
) {
  const { onError, ..._mutationOptions } = mutationOptions ?? {};

  const mutation = useMutation<GetCdnFileSuccessSchema, HTTPError, string>({
    mutationKey: cdnKeys[opt.key](opt.url),
    mutationFn: (url) => cdnRepositories().getCdnFile({ url }),
    onError: (error, variables, context) => {
      toast.error(error.message);

      onError?.(error, variables, context);
    },
    ..._mutationOptions,
  });

  return mutation;
}

/**
 * Get mutation state based on the mutation key.
 */
export function useCdnFileMutationState(opt: Opt) {
  return useMutationState<
    MutationState<GetCdnFileSuccessSchema, HTTPError, string>
  >({
    filters: {
      mutationKey: cdnKeys[opt.key](opt.url),
    },
  });
}
