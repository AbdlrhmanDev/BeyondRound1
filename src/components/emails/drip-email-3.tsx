/**
 * Drip Email 3 — "Referral push"
 * Sent: ~6 days after signup (3 days after Email 2)
 * EN subject: "Want earlier access? Bring one doctor with you"
 * DE subject: "Früher Zugang? Bringen Sie einen Arzt-Kollegen mit"
 */
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
    Link,
} from '@react-email/components';
import * as React from 'react';

interface DripEmail3Props {
    locale?: string;
    referralLink?: string;
    unsubUrl?: string;
}

export const DripEmail3 = ({
    locale = 'en',
    referralLink = 'https://beyondrounds.app/?ref=doctor',
    unsubUrl = 'https://beyondrounds.app/en/unsubscribe',
}: DripEmail3Props) => {
    const isDe = locale === 'de';
    const loc = isDe ? 'de' : 'en';

    const t = {
        preview: isDe
            ? 'Früher Zugang? Bringen Sie einen Arzt-Kollegen mit'
            : 'Want earlier access? Bring one doctor with you',
        greeting: isDe ? 'Hallo Doktor,' : 'Hi Doctor,',
        body1: isDe
            ? 'Wir öffnen BeyondRounds in kleinen Wellen.'
            : "We're opening BeyondRounds in small waves.",
        body2: isDe
            ? 'Wenn Sie früher Zugang möchten, ist das der einfachste Weg:'
            : "If you want earlier access, here's the simplest way:",
        cta: isDe
            ? 'Laden Sie einen Arzt-Kollegen ein, der Warteliste beizutreten.'
            : 'Invite one doctor colleague to join the waitlist.',
        linkLabel: isDe ? 'Ihr persönlicher Link' : 'Your personal link',
        ctaBtn: isDe ? 'Link teilen \u2192' : 'Share your link \u2192',
        body3: isDe
            ? 'Wenn jemand über Ihren Link beitritt, rücken Sie in der Warteschlange nach vorne.'
            : 'When someone joins through your link, we move you up the queue.',
        signoff: isDe ? 'Gründer, BeyondRounds' : 'Founder, BeyondRounds',
        footer: isDe
            ? 'Sie erhalten diese E-Mail, weil Sie sich auf der BeyondRounds Early-Access-Liste angemeldet haben.'
            : 'You received this because you joined the BeyondRounds early access list.',
        unsub: isDe ? 'Abmelden' : 'Unsubscribe',
    };

    return (
        <Html lang={loc}>
            <Head />
            <Preview>{t.preview}</Preview>
            <Tailwind>
                <Body className="bg-[#f4f4f5] font-sans">
                    <Container className="mx-auto my-8 max-w-[580px] bg-white rounded-lg overflow-hidden shadow-sm">

                        {/* Header */}
                        <Section className="bg-[#3A0B22] px-8 py-5">
                            <Text className="m-0 text-white text-sm font-semibold tracking-wide">
                                BeyondRounds
                            </Text>
                        </Section>

                        {/* Body */}
                        <Section className="px-9 py-8">
                            <Text className="text-base text-gray-800 leading-7 mt-0">{t.greeting}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.body1}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.body2}</Text>
                            <Text className="text-base text-gray-900 font-semibold leading-7">{t.cta}</Text>

                            {/* Referral box */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-6">
                                <Text className="m-0 mb-1 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                    {t.linkLabel}
                                </Text>
                                <Text className="m-0 mb-4 text-sm text-[#3A0B22] font-mono break-all leading-6">
                                    {referralLink}
                                </Text>
                                <Button
                                    href={referralLink}
                                    className="bg-[#3A0B22] text-white text-sm font-semibold px-5 py-3 rounded-md no-underline"
                                >
                                    {t.ctaBtn}
                                </Button>
                            </Section>

                            <Text className="text-base text-gray-800 leading-7">{t.body3}</Text>

                            {/* Signature */}
                            <Text className="text-base text-gray-700 mt-10 leading-7">
                                — Mostafa<br />
                                <span className="text-sm text-gray-500">{t.signoff}</span>
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section className="px-9 py-5 border-t border-gray-100">
                            <Text className="m-0 text-xs text-gray-400 leading-5">
                                {t.footer}{' '}
                                <Link href={unsubUrl} className="text-gray-400 underline">{t.unsub}</Link>
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default DripEmail3;
