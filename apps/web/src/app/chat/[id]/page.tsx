import { Chat } from '@/core/components/chat.client';
import { loadChat } from '@/core/utils/filesystem';

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const messages = await loadChat(id); // load the chat messages
  const message = messages.find((chat) => id === chat.id);

  return {
    title: message?.content.slice(0, 50) || 'Chat',
  };
}

export default async function ChatDetail({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params; // get the chat ID from the URL
  const messages = await loadChat(id); // load the chat messages

  return <Chat id={id} initialMessages={messages} />;
}
