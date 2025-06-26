import { redirect } from 'next/navigation';
import { createChat } from '@/core/utils/filesystem';

export default async function ChatPage() {
  const id = await createChat(); // create a new chat
  redirect(`/chat/${id}`); // redirect to chat page
}
