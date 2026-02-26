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

interface PasswordResetEmailProps {
    resetLink: string;
    locale?: string;
}

export const PasswordResetEmail = ({ resetLink, locale = 'en' }: PasswordResetEmailProps) => {
    const isDe = locale === 'de';

    const content = {
        preview: isDe ? 'Passwort zurücksetzen – BeyondRounds' : 'Reset your password – BeyondRounds',
        title: isDe ? 'Passwort zurücksetzen' : 'Reset your password',
        greeting: isDe ? 'Hallo,' : 'Hello,',
        body: isDe 
            ? 'Wir haben eine Anfrage zum Zurücksetzen Ihres Passworts für Ihr BeyondRounds-Konto erhalten. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu wählen.'
            : "We received a request to reset the password for your BeyondRounds account. Click the button below to choose a new password.",
        button: isDe ? 'Passwort zurücksetzen' : 'Reset Password',
        linkNote: isDe 
            ? 'Dieser Link läuft in 24 Stunden ab. Wenn Sie dies nicht angefordert haben, können Sie diese E-Mail sicher ignorieren.'
            : 'This link will expire in 24 hours. If you didn\'t request this, you can safely ignore this email.',
        footer: isDe ? 'Das BeyondRounds Team' : 'The BeyondRounds Team',
    };

    return (
        <Html>
            <Head />
            <Preview>{content.preview}</Preview>
            <Tailwind>
                <Body className="bg-[#F6F1EC] font-sans">
                    <Container className="mx-auto py-12 px-5 max-w-xl">
                        <Section className="bg-white border border-[#E8DED5] rounded-[24px] p-10 text-center shadow-sm">
                            <Heading className="text-3xl font-bold text-[#3A0B22] mb-6 tracking-tight">
                                {content.title}
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-6 text-left">
                                {content.greeting}
                            </Text>
                            <Text className="text-gray-700 text-base leading-relaxed mb-8 text-left">
                                {content.body}
                            </Text>
                            <Section className="mb-8">
                                <Button
                                    href={resetLink}
                                    className="bg-[#F27C5C] text-white py-4 px-8 rounded-full font-bold text-center no-underline"
                                >
                                    {content.button}
                                </Button>
                            </Section>
                            <Text className="text-gray-500 text-sm italic mb-8">
                                {content.linkNote}
                            </Text>
                            <Section className="border-t border-[#E8DED5] pt-8">
                                <Text className="text-[#3A0B22] font-semibold text-base m-0">
                                    {content.footer}
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

export default PasswordResetEmail;
