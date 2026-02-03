import type { Metadata } from 'next';
import GroupChatPageContent from '@/views/GroupChat';

export const metadata: Metadata = {
  title: 'Group Chat',
  description: 'Group chat with your matches on BeyondRounds.',
};

export const dynamic = 'force-dynamic';

interface GroupChatPageProps {
  params: {
    conversationId: string;
    locale: string;
  };
}

export default function GroupChatPage({ params }: GroupChatPageProps) {
  return <GroupChatPageContent />;
}
