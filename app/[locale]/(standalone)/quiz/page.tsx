import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';

const QuizPageContent = nextDynamic(() => import('@/views/Quiz'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
            <div className="animate-pulse rounded-2xl bg-white shadow-sm h-96 w-full max-w-lg" />
        </div>
    ),
});

export const metadata: Metadata = {
    title: "What's Your Social Health Score? — BeyondRounds",
    description: '15 quick questions to measure your social life in Berlin and find out how BeyondRounds can help you build real friendships as a doctor.',
    robots: { index: false },   // keep quiz private from search engines
};

export default function QuizPage() {
    return <QuizPageContent />;
}
