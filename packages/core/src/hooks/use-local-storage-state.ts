import { createUseStorageState } from '@workspace/core/hooks/create-use-storage-state';

/**
 * A Hook that store state into `localStorage`.
 *
 * @remarks
 *
 * `useLocalStorageState` will call serializer before write data to `localStorage`,
 * and call deserializer once after read data.
 */
export const useLocalStorageState = createUseStorageState(() => localStorage);
