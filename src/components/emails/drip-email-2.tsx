/**
 * Drip Email 2 — "Founder Story"
 * Sent: ~5 days after waitlist signup
 * EN subject: "Why I'm building this"
 * DE subject: "Warum ich das aufbaue"
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

interface DripEmail2Props {
    firstName?: string;
    locale?: string;
    unsubUrl?: string;
}

const CHECKOUT_URL = 'https://checkout.beyondrounds.app/b/9B68wQfvz275ft23sqbo404';

export const DripEmail2 = ({
    firstName,
    locale = 'en',
    unsubUrl = 'https://www.beyondrounds.app/en/unsubscribe',
}: DripEmail2Props) => {
    const isDe = locale === 'de';
    const loc = isDe ? 'de' : 'en';
    const waitlistUrl = `https://www.beyondrounds.app/${loc}/waitlist`;

    const t = {
        preview: isDe ? 'Warum ich das aufbaue' : "Why I'm building this",
        greeting: isDe
            ? (firstName ? `Hey ${firstName},` : 'Hey,')
            : (firstName ? `Hey ${firstName},` : 'Hey,'),
        intro: isDe ? 'Eine kurze Geschichte.' : 'Quick story.',
        story1: isDe
            ? 'Letzte Woche bin ich einem Kollegen in der Krankenhauscafeteria begegnet.'
            : 'Last week, I ran into a colleague at the hospital café.',
        story2: isDe
            ? 'Wir arbeiten seit 8 Monaten zusammen.'
            : "We've worked together for 8 months.",
        story3: isDe
            ? 'Er sagte: „Hey, wir sollten mal außerhalb der Arbeit einen Kaffee trinken gehen."'
            : 'He said: "Hey, we should grab coffee sometime outside work."',
        story4: isDe ? 'Ich sagte: „Ja, auf jeden Fall."' : 'I said: "Yeah, definitely."',
        story5: isDe ? 'Keiner von uns hat nachgefasst.' : 'Neither of us followed up.',
        whyTitle: isDe ? 'WARUM?' : 'WHY?',
        whyNot: isDe
            ? 'Nicht weil wir es nicht wollen. Sondern weil:'
            : "Not because we don't want to. But because:",
        reason1: isDe ? '→ Unsere Pläne stimmen nie überein' : "→ Our schedules never align",
        reason2: isDe ? '→ Wir haben kein System, um es umzusetzen' : "→ We don't have a system for making it happen",
        reason3: isDe
            ? '→ „Wir sollten uns treffen" bleibt immer nur „wir sollten"'
            : '→ "We should hang out" always stays "we should"',
        why: isDe ? 'Deshalb baue ich BeyondRounds.' : "This is why I'm building BeyondRounds.",
        tagline: isDe
            ? 'Um aus „wir sollten" ein „wir haben" zu machen.'
            : 'To turn "we should" into "we did."',
        updateTitle: isDe ? 'DAS UPDATE:' : 'THE UPDATE:',
        update: isDe
            ? 'Wir sind in der Schlussphase vor dem Launch. Die Warteliste füllt sich mit Ärzten, die genauso denken — bereit, aufzuhören zu hoffen, dass Freundschaften „einfach so entstehen", und anfangen, sie aktiv zu gestalten.'
            : 'We\'re in the final stretch before launch. The waitlist is filling up with doctors who feel the same way — ready to stop hoping friendships "just happen" and start making them happen.',
        youreFounder: isDe
            ? 'Sie sind Teil der Gründungsgruppe.'
            : "You're part of the founding group.",
        ctaIntro: isDe
            ? 'Wenn Sie es noch nicht getan haben, sichern Sie sich jetzt Ihr Gründer-Angebot!'
            : "If you haven't yet, secure your founder offer now!",
        ctaBtn: isDe ? 'Gründungspreis sichern — €9,99/Monat' : 'Secure Your Founding Rate — €9.99/Month',
        signoff: isDe ? 'Gründer, BeyondRounds' : 'Founder, BeyondRounds',
        ps: isDe
            ? 'P.S. Leite das an einen Kollegen weiter, dem das genauso geht.'
            : 'P.S. Forward this to a colleague who needs it.',
        referralLabel: isDe ? 'BeyondRounds Warteliste' : 'Beyond Rounds waiting list',
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
                            <Text className="text-base text-gray-500 leading-7">{t.intro}</Text>

                            <Text className="text-base text-gray-800 leading-7">{t.story1}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.story2}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.story3}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.story4}</Text>
                            <Text className="text-base text-gray-800 leading-7 font-medium">{t.story5}</Text>

                            <Text className="text-sm font-bold text-gray-500 tracking-wider uppercase mt-6 mb-2 leading-6">
                                {t.whyTitle}
                            </Text>
                            <Text className="text-base text-gray-800 leading-7 mb-2">{t.whyNot}</Text>
                            <Text className="text-base text-gray-800 leading-7 mb-1 mt-0">{t.reason1}</Text>
                            <Text className="text-base text-gray-800 leading-7 mb-1 mt-0">{t.reason2}</Text>
                            <Text className="text-base text-gray-800 leading-7 mb-6 mt-0">{t.reason3}</Text>

                            <Text className="text-base text-gray-800 leading-7">{t.why}</Text>

                            {/* Tagline highlight */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-4 mb-6">
                                <Text className="m-0 text-base text-[#3A0B22] font-semibold leading-7">
                                    {t.tagline}
                                </Text>
                            </Section>

                            <Text className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-2 leading-6">
                                {t.updateTitle}
                            </Text>
                            <Text className="text-base text-gray-800 leading-7">{t.update}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.youreFounder}</Text>

                            <Text className="text-base text-gray-800 leading-7 mt-6">{t.ctaIntro}</Text>
                            <Section className="mt-4 mb-6">
                                <Button
                                    href={CHECKOUT_URL}
                                    className="bg-[#3A0B22] text-white text-sm font-semibold px-6 py-4 rounded-md no-underline"
                                >
                                    {t.ctaBtn}
                                </Button>
                            </Section>

                            {/* Signature */}
                            <Text className="text-base text-gray-700 mt-10 leading-7">
                                — Mostafa
                            </Text>

                            <Text className="text-sm text-gray-600 leading-7 mt-4">
                                {t.ps}{' '}
                                <Link href={waitlistUrl} className="text-[#3A0B22] underline">
                                    {t.referralLabel}
                                </Link>
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

export default DripEmail2;
