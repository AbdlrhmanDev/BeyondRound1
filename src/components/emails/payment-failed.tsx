import {
    Body,
    Button,
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

interface PaymentFailedProps {
    amount: string;
    nextRetryDate: string;
    updatePaymentUrl: string;
    locale?: string;
}

const t = {
    en: {
        preview: 'Action required: payment failed for your BeyondRounds subscription',
        title: 'Payment failed',
        greeting: 'Hello,',
        body: (amount: string, retryDate: string) =>
            `We were unable to process your payment of ${amount}. We'll automatically retry on ${retryDate}. To avoid any interruption to your access, please update your payment method.`,
        button: 'Update payment method',
        note: 'If you have any questions, please reply to this email.',
        footer: 'The BeyondRounds Team',
    },
    de: {
        preview: 'Handlungsbedarf: Zahlung für Ihr BeyondRounds-Abonnement fehlgeschlagen',
        title: 'Zahlung fehlgeschlagen',
        greeting: 'Hallo,',
        body: (amount: string, retryDate: string) =>
            `Wir konnten Ihre Zahlung von ${amount} nicht verarbeiten. Wir werden es automatisch am ${retryDate} erneut versuchen. Um eine Unterbrechung Ihres Zugangs zu vermeiden, aktualisieren Sie bitte Ihre Zahlungsmethode.`,
        button: 'Zahlungsmethode aktualisieren',
        note: 'Wenn Sie Fragen haben, antworten Sie bitte auf diese E-Mail.',
        footer: 'Das BeyondRounds Team',
    },
};

export const PaymentFailedEmail = ({ amount, nextRetryDate, updatePaymentUrl, locale = 'en' }: PaymentFailedProps) => {
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
                            {/* Red accent warning block */}
                            <Section className="bg-red-50 border border-red-200 rounded-[8px] px-6 py-4 mb-6">
                                <Text className="text-red-700 font-semibold text-sm m-0">
                                    ⚠️ {locale === 'de' ? 'Zahlung fehlgeschlagen' : 'Payment failed'}
                                </Text>
                            </Section>
                            <Heading className="text-3xl font-bold text-[#3A0B22] mb-6 tracking-tight">
                                {c.title}
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-6">
                                {c.greeting}
                            </Text>
                            <Text className="text-gray-700 text-base leading-relaxed mb-8">
                                {c.body(amount, nextRetryDate)}
                            </Text>
                            <Section className="mb-8">
                                <Button
                                    href={updatePaymentUrl}
                                    className="bg-[#F27C5C] text-white py-4 px-8 rounded-full font-bold text-center no-underline"
                                >
                                    {c.button}
                                </Button>
                            </Section>
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

export default PaymentFailedEmail;
