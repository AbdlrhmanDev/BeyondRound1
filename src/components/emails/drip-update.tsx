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

interface DripUpdateEmailProps {
    locale?: string;
    dripNumber?: number;
}

export const DripUpdateEmail = ({ locale = 'en', dripNumber = 1 }: DripUpdateEmailProps) => {
    const isDe = locale === 'de';

    const content = {
        preview: isDe ? 'Wir kommen näher! 🚀' : "We're getting closer! 🚀",
        title: isDe ? 'Die Plattform ist fast fertig! 🚀' : 'The platform is almost ready! 🚀',
        body: isDe
            ? 'Wir arbeiten hart daran, Ihnen die bestmögliche Erfahrung zu bieten. Jeden Tag bringen wir neue Funktionen zum Leben, damit Sie sich von Anfang an zu Hause fühlen.'
            : "We're working hard to bring you the best possible experience. Every day we bring new features to life so you feel right at home from day one.",
        shareTitle: isDe ? 'Kennen Sie andere Ärzte?' : 'Know other doctors?',
        shareBody: isDe
            ? 'Helfen Sie uns, die Community aufzubauen! Teilen Sie BeyondRounds mit Ihren Kollegen — je mehr Ärzte dabei sind, desto besser werden die Verbindungen.'
            : 'Help us build the community! Share BeyondRounds with your colleagues — the more doctors join, the better the connections.',
        footer: isDe ? 'Bleiben Sie gespannt — es lohnt sich!' : 'Stay tuned — it will be worth it!',
        updateNumber: isDe ? `Update #${dripNumber}` : `Update #${dripNumber}`,
    };

    return (
        <Html>
            <Head />
            <Preview>{content.preview}</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto py-10 px-5 max-w-xl">
                        <Section className="mb-2">
                            <Text className="text-gray-400 text-sm uppercase tracking-widest m-0">
                                {content.updateNumber}
                            </Text>
                        </Section>
                        <Section className="mb-8">
                            <Heading className="text-2xl font-bold text-gray-900 mb-4">
                                {content.title}
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-6">
                                {content.body}
                            </Text>
                            <Section className="bg-orange-50 border border-orange-100 rounded-lg p-6 mb-6">
                                <Heading className="text-base font-semibold text-orange-900 m-0 mb-2">
                                    {content.shareTitle}
                                </Heading>
                                <Text className="text-orange-800 text-sm leading-relaxed m-0">
                                    {content.shareBody}
                                </Text>
                            </Section>
                            <Text className="text-gray-500 text-sm italic">
                                {content.footer}
                            </Text>
                        </Section>
                        <Section className="border-t border-gray-200 pt-6">
                            <Text className="text-gray-400 text-xs">
                                {isDe
                                    ? 'Sie erhalten diese E-Mail, weil Sie sich auf der BeyondRounds-Warteliste angemeldet haben.'
                                    : 'You are receiving this email because you signed up for the BeyondRounds waitlist.'}
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default DripUpdateEmail;
