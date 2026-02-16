import type { Metadata } from 'next';
import GroupChatPageContent from '@/views/GroupChat';

export const metadata: Metadata = {
  title: 'Group Chat',
  description: 'Chat with your group on BeyondRounds.',
};

export const dynamic = 'force-dynamic';

interface ChatPageProps {
  params: {
    conversationId: string;
    locale: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return <GroupChatPageContent />;
}
