import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { type Message, generateId } from 'ai';
import 'server-only';

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
