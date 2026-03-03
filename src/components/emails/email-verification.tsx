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

interface EmailVerificationProps {
    verificationLink: string;
    locale?: string;
}

const t = {
    en: {
        preview: 'Verify your email ,BeyondRounds',
        title: 'Verify your email address',
        greeting: 'Hello,',
        body: 'Thanks for signing up for BeyondRounds. Please verify your email address by clicking the button below.',
        button: 'Verify Email',
        linkNote: 'This link will expire in 24 hours. If you didn\'t create a BeyondRounds account, you can safely ignore this email.',
        footer: 'The BeyondRounds Team',
    },
    de: {
        preview: 'E-Mail-Adresse bestätigen,BeyondRounds',
        title: 'E-Mail-Adresse bestätigen',
        greeting: 'Hallo,',
        body: 'Vielen Dank für Ihre Registrierung bei BeyondRounds. Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf die Schaltfläche unten klicken.',
        button: 'E-Mail bestätigen',
        linkNote: 'Dieser Link läuft in 24 Stunden ab. Wenn Sie kein BeyondRounds-Konto erstellt haben, können Sie diese E-Mail sicher ignorieren.',
        footer: 'Das BeyondRounds Team',
    },
};

export const EmailVerification = ({ verificationLink, locale = 'en' }: EmailVerificationProps) => {
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
                        <Section className="bg-white border border-[#E8DED5] rounded-b-[12px] p-10 text-center shadow-sm">
                            <Heading className="text-3xl font-bold text-[#3A0B22] mb-6 tracking-tight">
                                {c.title}
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-6 text-left">
                                {c.greeting}
                            </Text>
                            <Text className="text-gray-700 text-base leading-relaxed mb-8 text-left">
                                {c.body}
                            </Text>
                            <Section className="mb-8">
                                <Button
                                    href={verificationLink}
                                    className="bg-[#F27C5C] text-white py-4 px-8 rounded-full font-bold text-center no-underline"
                                >
                                    {c.button}
                                </Button>
                            </Section>
                            <Text className="text-gray-500 text-sm italic mb-8">
                                {c.linkNote}
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

export default EmailVerification;
