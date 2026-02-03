import type { Metadata } from 'next';
import ChatPageContent from '@/views/Chat';

export const metadata: Metadata = {
  title: 'Chat',
  description: 'Chat with your matches on BeyondRounds.',
};

export const dynamic = 'force-dynamic';

interface ChatPageProps {
  params: {
    conversationId: string;
    locale: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  return <ChatPageContent />;
}
