import type { Metadata } from 'next';
import ChatListPageContent from '@/views/ChatList';

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Your group chats on BeyondRounds.',
};

export const dynamic = 'force-dynamic';

export default function ChatListPage() {
  return <ChatListPageContent />;
}
