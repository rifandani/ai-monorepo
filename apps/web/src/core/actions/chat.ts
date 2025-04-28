'use server';

import { actionClient } from '@/core/utils/action';
import { deleteChatHistory } from '@/core/utils/filesystem';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

/**
 * Deletes a chat history
 * @param id - The id of the chat to delete
 * @returns The success of the operation
 */
export const deleteChatAction = actionClient
  .metadata({ actionName: 'deleteChat' })
  .schema(z.object({ id: z.string(), redirect: z.boolean() }))
  .action(async ({ parsedInput }) => {
    await deleteChatHistory(parsedInput.id);
    revalidatePath('/chat');

    if (parsedInput.redirect) {
      redirect('/chat');
    }

    return { error: null, data: true };
  });
