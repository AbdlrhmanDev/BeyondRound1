/**
 * Drip Email 1 — "How matching will work"
 * Sent: ~24 hours after signup
 * EN subject: "How matching will work (in plain English)"
 * DE subject: "So funktioniert das Matching bei BeyondRounds"
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

interface DripEmail1Props {
    locale?: string;
    unsubUrl?: string;
}

export const DripEmail1 = ({
    locale = 'en',
    unsubUrl = 'https://beyondrounds.app/en/unsubscribe',
}: DripEmail1Props) => {
    const isDe = locale === 'de';
    const loc = isDe ? 'de' : 'en';
    const prefsLink = `https://beyondrounds.app/${loc}/quiz`;

    const t = {
        preview: isDe
            ? 'So funktioniert das Matching bei BeyondRounds'
            : 'How matching will work (in plain English)',
        greeting: isDe ? 'Hallo Doktor,' : 'Hi Doctor,',
        intro: isDe
            ? 'Kurzer Überblick, wie BeyondRounds funktioniert:'
            : 'Quick overview of how BeyondRounds works:',
        step1title: isDe ? '1. Nur verifizierte Ärzte' : '1. Verified doctors only',
        step1body: isDe
            ? 'Wir bestätigen die Mitgliedschaft diskret, damit die Community sicher bleibt.'
            : 'We confirm membership privately to keep the community safe.',
        step2title: isDe ? '2. Kleine, kuratierte Gruppen' : '2. Small curated groups',
        step2body: isDe
            ? 'Sie werden basierend auf Ihren Interessen + Verfügbarkeit in eine kleine Gruppe eingeteilt.'
            : "You'll be placed in a small group based on your interests + availability.",
        step3title: isDe ? '3. Wöchentliche Wellen, keine Spam-Events' : '3. Weekly waves, not spammy events',
        step3body: isDe
            ? 'Wir öffnen neue Matches in Wellen, damit echte Treffen zustande kommen.'
            : 'We open new matches in waves so people actually meet.',
        ctaIntro: isDe
            ? 'Damit wir Sie besser matchen können, sagen Sie uns, was Sie bevorzugen:'
            : 'If you want us to match you better, tell us what you prefer:',
        ctaOptions: isDe
            ? 'Kaffee / Abendessen / Sport / Spaziergänge\nEnglisch / Deutsch\nTypische freie Tage'
            : 'Coffee / dinner / sports / walks\nEnglish / German\nTypical free days',
        ctaBtn: isDe ? 'Präferenzen festlegen \u2192' : 'Set your preferences \u2192',
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
                            <Text className="text-base text-gray-800 leading-7">{t.intro}</Text>

                            <Section className="mb-6">
                                <Text className="text-base text-gray-800 leading-7 mb-2">
                                    <strong>{t.step1title}</strong>
                                    <br />{t.step1body}
                                </Text>
                                <Text className="text-base text-gray-800 leading-7 mb-2">
                                    <strong>{t.step2title}</strong>
                                    <br />{t.step2body}
                                </Text>
                                <Text className="text-base text-gray-800 leading-7">
                                    <strong>{t.step3title}</strong>
                                    <br />{t.step3body}
                                </Text>
                            </Section>

                            <Text className="text-base text-gray-800 leading-7">{t.ctaIntro}</Text>

                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-6">
                                <Text className="m-0 mb-3 text-sm text-gray-600 leading-7">
                                    {t.ctaOptions.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>{line}{i < 2 && <br />}</React.Fragment>
                                    ))}
                                </Text>
                                <Button
                                    href={prefsLink}
                                    className="bg-[#3A0B22] text-white text-sm font-semibold px-5 py-3 rounded-md no-underline"
                                >
                                    {t.ctaBtn}
                                </Button>
                            </Section>

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

export default DripEmail1;
