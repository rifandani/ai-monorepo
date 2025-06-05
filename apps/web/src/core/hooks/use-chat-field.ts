import { z } from 'zod';
import { create } from 'zustand';

export type ChatFieldStoreState = z.infer<typeof chatFieldStoreStateSchema>;
type ChatFieldStore = z.infer<typeof _chatFieldStoreSchema>;

const chatFieldStoreStateSchema = z.object({
  showSearch: z.boolean(),
  showDeepResearch: z.boolean(),
});
const chatFieldStoreActionSchema = z.object({
  reset: z.function().args(z.void()).returns(z.void()),
  setShowSearch: z.function().args(z.boolean()).returns(z.void()),
  setShowDeepResearch: z.function().args(z.boolean()).returns(z.void()),
});
const _chatFieldStoreSchema = chatFieldStoreStateSchema.merge(
  chatFieldStoreActionSchema
);

/**
 * app store state default values
 */
export const chatFieldStoreStateDefaultValues: ChatFieldStoreState = {
  showSearch: false,
  showDeepResearch: false,
};

/**
 * Hooks to manipulate chat field store
 *
 * @example
 *
 * ```tsx
 * const showSearch = useChatFieldStore(state => state.showSearch)
 * const setShowSearch = useChatFieldStore(state => state.setShowSearch)
 * ```
 */
export const useChatFieldStore = create<ChatFieldStore>()((set) => ({
  showSearch: chatFieldStoreStateDefaultValues.showSearch,
  showDeepResearch: chatFieldStoreStateDefaultValues.showDeepResearch,

  reset: () => {
    set(chatFieldStoreStateDefaultValues);
  },
  setShowSearch: (showSearch) => {
    set({ showSearch });
  },
  setShowDeepResearch: (showDeepResearch) => {
    set({ showDeepResearch });
  },
}));
