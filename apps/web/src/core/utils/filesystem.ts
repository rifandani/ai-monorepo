import { existsSync, mkdirSync } from 'node:fs';
import { readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { type Message, generateId } from 'ai';
import 'server-only';
import { logger } from '@workspace/core/utils/logger';

/**
 * Create a new chat
 * @returns The chat ID
 */
export async function createChat(): Promise<string> {
  const id = generateId(); // generate a unique chat ID
  await writeFile(getChatFile(id), '[]'); // create an empty chat file
  return id;
}

/**
 * Get the chat file path
 * @param id - The chat ID
 * @returns The chat file path
 */
function getChatFile(id: string): string {
  const chatDir = path.join(process.cwd(), '.chats');
  if (!existsSync(chatDir)) {
    mkdirSync(chatDir, { recursive: true });
  }
  return path.join(chatDir, `${id}.json`);
}

/**
 * Get the chat history from .chats directory
 * @returns The chat history
 */
export async function getChatHistory() {
  const chatsDir = path.join(process.cwd(), '.chats');

  try {
    const files = await readdir(chatsDir);
    const chatFiles = files.filter((file) => file.endsWith('.json'));

    const chatHistories = await Promise.all(
      chatFiles.map(async (file) => {
        const filePath = path.join(chatsDir, file);
        const fileContent = await readFile(filePath, 'utf-8');
        const messages: Message[] = JSON.parse(fileContent);
        const id = path.basename(file, '.json');
        const content =
          `${messages[0]?.content.substring(0, 30)}...` || 'Untitled Chat';
        return { id, content, createdAt: messages[0]?.createdAt };
      })
    );

    // chatHistories.sort(
    //   (a, b) => b.createdAt?.getTime() - a.createdAt?.getTime()
    // );

    return chatHistories;
  } catch (error) {
    logger.error(error, '[getChatHistory]: Error reading chat histories');
    return [];
  }
}

/**
 * Load a chat
 * @param id - The chat ID
 * @returns The chat messages
 */
export async function loadChat(id: string): Promise<Message[]> {
  return JSON.parse(await readFile(getChatFile(id), 'utf8'));
}

/**
 * Save a chat
 * @param id - The chat ID
 * @param messages - The chat messages
 */
export async function saveChat({
  id,
  messages,
}: {
  id: string;
  messages: Message[];
}): Promise<void> {
  const content = JSON.stringify(messages, null, 2);
  await writeFile(getChatFile(id), content);
}

/**
 * Delete a chat history
 * @param id - The chat ID
 */
export async function deleteChatHistory(id: string): Promise<void> {
  const filePath = getChatFile(id);
  try {
    await unlink(filePath);
  } catch (error) {
    // Check if error is an object and has a code property
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      logger.warn(
        `[deleteChat]: Chat file not found, skipping delete: ${filePath}`
      );
      return;
    }
    logger.error(error, `[deleteChat]: Error deleting chat file: ${filePath}`);
    // Re-throw the error if it's not a "file not found" error or a standard Error
    throw error;
  }
}
