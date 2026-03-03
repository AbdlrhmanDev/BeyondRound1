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
    Row,
    Column,
} from '@react-email/components';
import * as React from 'react';

interface SubscriptionStartedProps {
    planName: string;
    nextBillingDate: string;
    amount: string;
    locale?: string;
}

const t = {
    en: {
        preview: 'Your BeyondRounds subscription is active',
        title: 'Subscription confirmed',
        greeting: 'Hello,',
        body: 'Your BeyondRounds subscription is now active. Here\'s a summary of your plan:',
        plan: 'Plan',
        amount: 'Amount',
        nextBilling: 'Next billing date',
        note: 'You can manage your subscription at any time from your account settings.',
        footer: 'The BeyondRounds Team',
        unsubNote: 'This is a transactional email related to your account.',
    },
    de: {
        preview: 'Ihr BeyondRounds-Abonnement ist aktiv',
        title: 'Abonnement bestätigt',
        greeting: 'Hallo,',
        body: 'Ihr BeyondRounds-Abonnement ist jetzt aktiv. Hier ist eine Zusammenfassung Ihres Plans:',
        plan: 'Plan',
        amount: 'Betrag',
        nextBilling: 'Nächstes Abrechnungsdatum',
        note: 'Sie können Ihr Abonnement jederzeit in Ihren Kontoeinstellungen verwalten.',
        footer: 'Das BeyondRounds Team',
        unsubNote: 'Dies ist eine Transaktions-E-Mail zu Ihrem Konto.',
    },
};

export const SubscriptionStartedEmail = ({ planName, nextBillingDate, amount, locale = 'en' }: SubscriptionStartedProps) => {
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
                            <Text className="text-gray-700 text-lg leading-relaxed mb-4">
                                {c.greeting}
                            </Text>
                            <Text className="text-gray-700 text-base leading-relaxed mb-6">
                                {c.body}
                            </Text>
                            {/* Receipt box */}
                            <Section className="bg-[#f4f4f5] rounded-[12px] p-6 mb-6">
                                <Row className="mb-3">
                                    <Column className="w-1/2">
                                        <Text className="text-gray-500 text-sm m-0">{c.plan}</Text>
                                    </Column>
                                    <Column className="w-1/2 text-right">
                                        <Text className="text-gray-900 font-semibold text-sm m-0">{planName}</Text>
                                    </Column>
                                </Row>
                                <Row className="mb-3">
                                    <Column className="w-1/2">
                                        <Text className="text-gray-500 text-sm m-0">{c.amount}</Text>
                                    </Column>
                                    <Column className="w-1/2 text-right">
                                        <Text className="text-gray-900 font-semibold text-sm m-0">{amount}</Text>
                                    </Column>
                                </Row>
                                <Row>
                                    <Column className="w-1/2">
                                        <Text className="text-gray-500 text-sm m-0">{c.nextBilling}</Text>
                                    </Column>
                                    <Column className="w-1/2 text-right">
                                        <Text className="text-gray-900 font-semibold text-sm m-0">{nextBillingDate}</Text>
                                    </Column>
                                </Row>
                            </Section>
                            <Text className="text-gray-500 text-sm mb-8">
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

export default SubscriptionStartedEmail;
