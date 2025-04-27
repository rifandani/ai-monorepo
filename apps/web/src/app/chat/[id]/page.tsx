import { Chat } from '@/core/components/chat';
import { loadChat } from '@/core/utils/filesystem';

export default async function ChatDetail({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params; // get the chat ID from the URL
  const messages = await loadChat(id); // load the chat messages

  return <Chat id={id} initialMessages={messages} />;
}
