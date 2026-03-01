/**
 * Drip Weekly Nurture — ongoing after Email 4
 * Sent: every 7 days after Email 4 ends
 * Subjects rotate through 3 variants (controlled by weekNum prop)
 * EN + DE supported via locale prop
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

interface DripWeeklyProps {
    locale?: string;
    referralLink?: string;
    /** 1-based week number (1 = first weekly after Email 4). Controls subject + tagline rotation. */
    weekNum?: number;
    unsubUrl?: string;
}

const EN_SUBJECTS = [
    'Quick update: Berlin wave is building',
    "We're adding more doctors before wave 1",
    'Matching starts soon \u2014 do this to get priority',
];

const EN_TAGLINES = [
    "we're growing the Berlin list to make matching strong from day 1.",
    'more doctors are joining every day \u2014 matching will be better for it.',
    "we're finalising group sizes and neighbourhoods before opening.",
];

const DE_SUBJECTS = [
    'Kurzes Update: Berliner Welle wächst',
    'Wir fügen vor Welle 1 mehr Ärzte hinzu',
    'Matching startet bald \u2014 so erhalten Sie Priorität',
];

const DE_TAGLINES = [
    'wir wachsen die Berliner Liste, damit das Matching von Anfang an stark ist.',
    'täglich kommen mehr Ärzte dazu \u2014 das Matching wird davon profitieren.',
    'wir finalisieren Gruppengrößen und Stadtteile vor der Öffnung.',
];

export const DripWeekly = ({
    locale = 'en',
    referralLink = 'https://beyondrounds.app/?ref=doctor',
    weekNum = 1,
    unsubUrl = 'https://beyondrounds.app/en/unsubscribe',
}: DripWeeklyProps) => {
    const isDe = locale === 'de';
    const loc = isDe ? 'de' : 'en';
    const prefsLink = `https://beyondrounds.app/${loc}/quiz`;

    const idx = (weekNum - 1) % EN_SUBJECTS.length;
    const subject = isDe ? DE_SUBJECTS[idx] : EN_SUBJECTS[idx];
    const tagline = isDe ? DE_TAGLINES[idx] : EN_TAGLINES[idx];

    const t = {
        subject,
        greeting: isDe ? 'Hallo Doktor,' : 'Hi Doctor,',
        update: isDe ? `Kurzes Update: ${tagline}` : `Quick update: ${tagline}`,
        priorityIntro: isDe
            ? 'Wenn Sie Priority Access möchten, tun Sie diese 2 Dinge:'
            : 'If you want priority access, do these 2 things:',
        linkPrefs: isDe ? '1. Präferenzen vervollständigen \u2192' : '1. Complete your preferences \u2192',
        linkReferral: isDe ? '2. Einen Kollegen einladen \u2192' : '2. Invite one colleague \u2192',
        thatsIt: isDe ? 'Das war es.' : "That's it.",
        signoff: isDe ? 'Gründer, BeyondRounds' : 'Founder, BeyondRounds',
        footer: isDe
            ? 'Sie erhalten diese E-Mail, weil Sie sich auf der BeyondRounds Early-Access-Liste angemeldet haben.'
            : 'You received this because you joined the BeyondRounds early access list.',
        unsub: isDe ? 'Abmelden' : 'Unsubscribe',
    };

    return (
        <Html lang={loc}>
            <Head />
            <Preview>{t.subject}</Preview>
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
                            <Text className="text-base text-gray-800 leading-7">{t.update}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.priorityIntro}</Text>

                            {/* CTA box */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-6">
                                <Text className="m-0 mb-3 text-base text-gray-800 leading-8">
                                    <Link href={prefsLink} className="text-[#3A0B22] font-semibold no-underline">
                                        {t.linkPrefs}
                                    </Link>
                                </Text>
                                <Text className="m-0 text-base text-gray-800 leading-8">
                                    <Link href={referralLink} className="text-[#3A0B22] font-semibold no-underline">
                                        {t.linkReferral}
                                    </Link>
                                </Text>
                            </Section>

                            <Text className="text-base text-gray-800 leading-7">{t.thatsIt}</Text>

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

/** Convenience helper: returns the subject line for a given weekNum and locale */
export function getDripWeeklySubject(weekNum: number, locale: string = 'en'): string {
    const idx = (weekNum - 1) % EN_SUBJECTS.length;
    return locale === 'de' ? DE_SUBJECTS[idx] : EN_SUBJECTS[idx];
}

export default DripWeekly;
