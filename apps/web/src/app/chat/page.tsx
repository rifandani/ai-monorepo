import { createChat } from '@/core/utils/filesystem';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const id = await createChat(); // create a new chat
  redirect(`/chat/${id}`); // redirect to chat page
}
