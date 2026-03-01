/**
 * Drip Email 4 — "Slots opening soon"
 * Sent: ~10 days after signup (4 days after Email 3)
 * EN subject: "Berlin matching starts soon — here's how invites work"
 * DE subject: "Das Matching in Berlin startet bald — so funktionieren die Einladungen"
 */
import {
    Body,
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

interface DripEmail4Props {
    locale?: string;
    unsubUrl?: string;
}

export const DripEmail4 = ({
    locale = 'en',
    unsubUrl = 'https://beyondrounds.app/en/unsubscribe',
}: DripEmail4Props) => {
    const isDe = locale === 'de';
    const loc = isDe ? 'de' : 'en';
    const prefsLink = `https://beyondrounds.app/${loc}/quiz`;
    const priorityLink = `https://beyondrounds.app/${loc}/waitlist`;

    const t = {
        preview: isDe
            ? 'Das Matching in Berlin startet bald \u2014 so funktionieren die Einladungen'
            : "Berlin matching starts soon \u2014 here's how invites work",
        greeting: isDe ? 'Hallo Doktor,' : 'Hi Doctor,',
        body1: isDe
            ? 'Wir sind kurz davor, das Matching in Berlin zu starten.'
            : "We're close to starting matching in Berlin.",
        body2: isDe
            ? 'Um die Qualität hoch zu halten, laden wir Menschen in Wellen ein:'
            : "To keep quality high, we'll invite people in waves:",
        bullet1: isDe
            ? 'Eine begrenzte Anzahl neuer Mitglieder pro Welle'
            : 'A limited number of new members per wave',
        bullet2: isDe
            ? 'Priorität haben Personen, die Präferenzen + Verifizierung schnell abschließen'
            : 'Priority goes to people who complete preferences + verification quickly',
        body3: isDe
            ? 'Falls Sie es noch nicht getan haben, nehmen Sie sich 60 Sekunden:'
            : "If you haven't done it yet, take 60 seconds:",
        linkPrefs: isDe ? '\u2192 Präferenzen' : '\u2192 Preferences',
        linkPriority: isDe ? '\u2192 Priority-Formular' : '\u2192 Priority access form',
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

                            {/* Bullet list */}
                            <Section className="mb-6">
                                <Text className="text-base text-gray-800 leading-7 mb-1">
                                    &bull;&nbsp; {t.bullet1}
                                </Text>
                                <Text className="text-base text-gray-800 leading-7">
                                    &bull;&nbsp; {t.bullet2}
                                </Text>
                            </Section>

                            <Text className="text-base text-gray-800 leading-7">{t.body3}</Text>

                            {/* CTA box */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-6">
                                <Text className="m-0 mb-3 text-base text-gray-800 leading-8">
                                    <Link href={prefsLink} className="text-[#3A0B22] font-semibold no-underline">
                                        {t.linkPrefs}
                                    </Link>
                                </Text>
                                <Text className="m-0 text-base text-gray-800 leading-8">
                                    <Link href={priorityLink} className="text-[#3A0B22] font-semibold no-underline">
                                        {t.linkPriority}
                                    </Link>
                                </Text>
                            </Section>

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

export default DripEmail4;
