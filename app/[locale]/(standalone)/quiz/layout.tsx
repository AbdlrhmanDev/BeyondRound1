import { ToasterOnlyLayout } from '@/components/ToasterOnlyLayout';

export default function QuizLayout({ children }: { children: React.ReactNode }) {
    return <ToasterOnlyLayout>{children}</ToasterOnlyLayout>;
}
