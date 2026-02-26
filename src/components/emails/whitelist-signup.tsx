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

interface WhitelistEmailProps {
    locale?: string;
}

export const WhitelistEmail = ({ locale = 'en' }: WhitelistEmailProps) => {
    const isDe = locale === 'de';

    const content = {
        preview: isDe ? 'Sie sind auf der Warteliste!' : 'You’re on the whitelist!',
        title: isDe ? 'Sie sind auf der Warteliste! 🎉' : 'You’re on the whitelist! 🎉',
        secured: isDe ? 'Ihr Platz ist gesichert.' : 'Your spot is secured.',
        body: isDe 
            ? "Vielen Dank für Ihr Interesse! Wir haben Sie in unsere exklusive Warteliste aufgenommen. Wir führen den Zugang derzeit in Chargen ein, um die beste Erfahrung für alle zu gewährleisten."
            : "Thank you for your interest! We've added you to our exclusive whitelist. We're currently rolling out access in batches to ensure the best experience for everyone.",
        nextTitle: isDe ? 'Was passiert als Nächstes?' : 'What happens next?',
        nextStep1: isDe ? '1. Unser Team wird Ihre Bewerbung prüfen.' : "1. Our team will review your application.",
        nextStep2: isDe ? '2. Sie erhalten einen Einladungslink, wenn Ihre Charge bereit ist.' : "2. You'll receive an invitation link when your batch is ready.",
        nextStep3: isDe ? '3. Wir erwarten, dass die nächste Charge innerhalb der nächsten 2-4 Wochen eingeladen wird.' : "3. We expect the next batch to be invited within the next 2-4 weeks.",
        footer: isDe ? 'Bleiben Sie gespannt auf weitere Updates in Ihrem Posteingang!' : 'Stay tuned for more updates in your inbox!',
    };

    return (
        <Html>
            <Head />
            <Preview>{content.preview}</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto py-10 px-5 max-w-xl text-center">
                        <Section className="mb-8">
                            <Heading className="text-3xl font-bold text-gray-900 mb-6">
                                {content.title}
                            </Heading>
                            <Section className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
                                <Text className="text-blue-900 text-lg font-medium m-0">
                                    {content.secured}
                                </Text>
                            </Section>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-4 text-left">
                                {content.body}
                            </Text>
                            <Heading className="text-xl font-semibold text-gray-800 mb-2 text-left">
                                {content.nextTitle}
                            </Heading>
                            <Text className="text-gray-700 text-base leading-relaxed mb-4 text-left">
                                {content.nextStep1} <br />
                                {content.nextStep2} <br />
                                {content.nextStep3}
                            </Text>
                            <Text className="text-gray-500 text-sm italic text-left">
                                {content.footer}
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WhitelistEmail;
