import {
    Body,
    Button,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface MagicLinkEmailProps {
    magicLink: string;
    locale?: string;
}

const t = {
    en: {
        preview: 'Your sign-in link – BeyondRounds',
        title: 'Sign in to BeyondRounds',
        body: 'Click the button below to sign in. This link expires in 15 minutes and can only be used once.',
        button: 'Sign In',
        linkNote: "If you didn't request this, you can safely ignore this email. Someone may have entered your address by mistake.",
        footer: 'The BeyondRounds Team',
    },
    de: {
        preview: 'Ihr Anmeldelink – BeyondRounds',
        title: 'Bei BeyondRounds anmelden',
        body: 'Klicken Sie auf die Schaltfläche unten, um sich anzumelden. Dieser Link läuft in 15 Minuten ab und kann nur einmal verwendet werden.',
        button: 'Anmelden',
        linkNote: 'Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail sicher ignorieren. Möglicherweise hat jemand Ihre Adresse versehentlich eingegeben.',
        footer: 'Das BeyondRounds Team',
    },
};

export const MagicLinkEmail = ({ magicLink, locale = 'en' }: MagicLinkEmailProps) => {
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
                            <Text className="text-3xl font-bold text-[#3A0B22] mb-6 tracking-tight">
                                {c.title}
                            </Text>
                            <Text className="text-gray-700 text-base leading-relaxed mb-8 text-left">
                                {c.body}
                            </Text>
                            <Section className="mb-8">
                                <Button
                                    href={magicLink}
                                    className="bg-[#3A0B22] text-white py-4 px-8 rounded-full font-bold text-center no-underline"
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

export default MagicLinkEmail;
