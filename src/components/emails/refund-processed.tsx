import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface RefundProcessedProps {
    amount: string;
    planName: string;
    locale?: string;
}

const t = {
    en: {
        preview: 'Your BeyondRounds refund is being processed',
        title: 'Refund processed',
        greeting: 'Hello,',
        body: (amount: string, plan: string) =>
            `We've processed a refund of ${amount} for your ${plan} subscription. Please allow 5–10 business days for the amount to appear in your account, depending on your bank or card issuer.`,
        note: 'If you have any questions about your refund, please reply to this email.',
        footer: 'The BeyondRounds Team',
    },
    de: {
        preview: 'Ihre BeyondRounds-Rückerstattung wird bearbeitet',
        title: 'Rückerstattung bearbeitet',
        greeting: 'Hallo,',
        body: (amount: string, plan: string) =>
            `Wir haben eine Rückerstattung von ${amount} für Ihr ${plan}-Abonnement veranlasst. Bitte erlauben Sie 5–10 Werktage, bis der Betrag auf Ihrem Konto erscheint, abhängig von Ihrer Bank oder Ihrem Kartenaussteller.`,
        note: 'Wenn Sie Fragen zu Ihrer Rückerstattung haben, antworten Sie bitte auf diese E-Mail.',
        footer: 'Das BeyondRounds Team',
    },
};

export const RefundProcessedEmail = ({ amount, planName, locale = 'en' }: RefundProcessedProps) => {
    const c = locale === 'de' ? t.de : t.en;

    return (
        <Html>
            <Head />
            <Preview>{c.preview}</Preview>
            <Tailwind>
                <Body className="bg-[#f4f4f5] font-sans">
                    <Container className="mx-auto py-12 px-5 max-w-xl">
                        <Section className="bg-[#3A0B22] rounded-t-[12px] px-10 py-5">
                            <Text className="text-white font-bold text-lg m-0">BeyondRounds</Text>
                        </Section>
                        <Section className="bg-white border border-[#E8DED5] rounded-b-[12px] p-10 shadow-sm">
                            <Heading className="text-3xl font-bold text-[#3A0B22] mb-6 tracking-tight text-center">
                                {c.title}
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-6">
                                {c.greeting}
                            </Text>
                            <Text className="text-gray-700 text-base leading-relaxed mb-8">
                                {c.body(amount, planName)}
                            </Text>
                            <Text className="text-gray-500 text-sm italic mb-8">
                                {c.note}
                            </Text>
                            <Section className="border-t border-[#E8DED5] pt-8">
                                <Text className="text-[#3A0B22] font-semibold text-base m-0">
                                    {c.footer}
                                </Text>
                            </Section>
                        </Section>
                        <Text className="text-center text-gray-400 text-xs mt-8">
                            © 2026 BeyondRounds Berlin
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default RefundProcessedEmail;
