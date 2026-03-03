/**
 * Drip Email 1 — "Founding Member Offer"
 * Sent: Day 2 after waitlist signup
 * EN subject: "Your founding member access (€9.99/month forever)"
 * DE subject: "Ihr Gründungsmitglieds-Zugang (€9,99/Monat für immer)"
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
    Hr,
} from '@react-email/components';
import * as React from 'react';

interface DripEmail1Props {
    firstName?: string;
    locale?: string;
    unsubUrl?: string;
}

const CHECKOUT_URL = 'https://checkout.beyondrounds.app/b/9B68wQfvz275ft23sqbo404';

export const DripEmail1 = ({
    firstName,
    locale = 'en',
    unsubUrl = 'https://app.beyondrounds.app/en/unsubscribe',
}: DripEmail1Props) => {
    const isDe = locale === 'de';
    const loc = isDe ? 'de' : 'en';
    const waitlistUrl = `https://www.beyondrounds.app/${loc}/waitlist`;

    const t = {
        preview: isDe
            ? 'Ihr Gründungsmitglieds-Zugang (€9,99/Monat für immer)'
            : 'Your founding member access (€9.99/month forever)',
        greeting: isDe
            ? (firstName ? `Hey ${firstName},` : 'Hey,')
            : (firstName ? `Hey ${firstName},` : 'Hey,'),
        update: isDe
            ? 'Ein kurzes Update von der BeyondRounds-Warteliste.'
            : 'Quick update from the BeyondRounds waitlist.',
        youreFirst: isDe
            ? 'Sie gehören zu den ersten 100 Ärzten auf unserer Liste.'
            : "You're one of the first 100 doctors on our list.",
        thatMeans: isDe
            ? 'Das bedeutet, Sie qualifizieren sich für den Gründungspreis:'
            : 'That means you qualify for founding member pricing:',
        price: isDe ? '€9,99/Monat' : '€9.99/month',
        priceLabel: isDe ? '— FÜR IMMER GESPERRT' : '— LOCKED FOREVER',
        notIntro: isDe
            ? 'Nicht „für 6 Monate" oder „Einführungspreis".'
            : 'Not "for 6 months" or "introductory rate."',
        foreverNote: isDe
            ? 'Für immer. Während alle nach dem Launch €19,99/Monat zahlen, zahlen Sie €9,99 — so lange Sie Mitglied sind.'
            : "Forever. While everyone who joins after launch pays €19.99/month, you'll pay €9.99 for as long as you're a member.",
        whyTitle: isDe ? 'WARUM WIR DAS TUN:' : "WHY WE'RE DOING THIS:",
        why: isDe
            ? 'Sie wetten auf uns, bevor wir etwas bewiesen haben. Wir belohnen das mit einem lebenslangen Preis.'
            : "You're betting on us before we're proven. We're rewarding that with a lifetime rate.",
        benefitsTitle: isDe ? 'VORTEILE ALS GRÜNDUNGSMITGLIED:' : 'FOUNDING MEMBER BENEFITS:',
        benefit1: isDe ? '€9,99/Monat für immer (gesperrter Preis)' : '€9.99/month forever (locked rate)',
        benefit2: isDe ? 'Prioritäts-Matching (erster Zugang zu wöchentlichen Matches)' : 'Priority matching (first access to weekly matches)',
        benefit3: isDe ? 'Erster Zugang, wenn wir in neue Städte expandieren' : 'First access when we launch in new cities',
        benefit4: isDe ? 'Abstimmung über neue Features' : 'Vote on new features',
        benefit5: isDe ? 'Früher Zugang zu allen neuen Features' : 'Early access to all new features',
        ctaTitle: isDe ? 'BEREIT, IHREN PREIS ZU SICHERN?' : 'READY TO LOCK IN YOUR RATE?',
        ctaBtn: isDe ? 'Gründungspreis sichern — €9,99/Monat' : 'Secure Your Founding Rate — €9.99/Month',
        deadline: isDe
            ? 'Dieser Link ist bis zum Launch aktiv (31. März). Danach zahlen alle €19,99/Monat.'
            : "This link stays active until launch (March 31). After that, it's €19.99/month for everyone else.",
        guaranteeTitle: isDe ? 'DIE GARANTIE:' : 'THE GUARANTEE:',
        guarantee: isDe
            ? 'Wenn Sie sich in Ihren ersten 30 Tagen nicht mit mindestens EINER Gruppe treffen, wählen Sie: volle Rückerstattung oder ein zusätzlicher Monat gratis. Sie verlieren nichts.'
            : "If you don't meet up with at least ONE group in your first 30 days, choose: full refund or extra month free. You don't lose if this doesn't work.",
        ps: isDe
            ? 'P.S. Noch nicht bereit? Kein Druck. Sie können bis zum Launch warten und den regulären Preis zahlen (€19,99/Monat). Aber wenn Sie das wollen, sichern Sie sich jetzt €9,99.'
            : "P.S. Not ready yet? No pressure. You can wait until launch and pay regular price (€19.99/month). But if you know you want this, lock in €9.99 now.",
        referralText: isDe ? 'Optional: Möchten Sie einem Kollegen helfen?' : 'Optional: want to help a colleague?',
        referralLabel: isDe ? 'Warteliste teilen' : 'Share the waitlist',
        signoff: isDe ? 'Gründer, BeyondRounds' : 'Founder, BeyondRounds',
        footer: isDe
            ? 'Sie erhalten diese E-Mail, weil Sie sich auf der BeyondRounds Early-Access-Liste angemeldet haben.'
            : 'You received this because you joined the BeyondRounds early access list.',
        unsub: isDe ? 'Abmelden' : 'Unsubscribe',
    };

    const benefits = [t.benefit1, t.benefit2, t.benefit3, t.benefit4, t.benefit5];

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
                            <Text className="text-base text-gray-500 leading-7">{t.update}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.youreFirst}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.thatMeans}</Text>

                            {/* Price highlight */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-4">
                                <Text className="m-0 text-2xl text-[#3A0B22] font-bold leading-8">
                                    {t.price}
                                </Text>
                                <Text className="m-0 text-sm text-gray-700 font-semibold tracking-wide mt-1">
                                    {t.priceLabel}
                                </Text>
                            </Section>

                            <Text className="text-base text-gray-800 leading-7">{t.notIntro}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.foreverNote}</Text>

                            <Hr className="border-gray-100 my-6" />

                            <Text className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-2 leading-6">
                                {t.whyTitle}
                            </Text>
                            <Text className="text-base text-gray-800 leading-7 mb-6">{t.why}</Text>

                            <Text className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-3 leading-6">
                                {t.benefitsTitle}
                            </Text>
                            {benefits.map((b, i) => (
                                <Text key={i} className="text-base text-gray-800 leading-7 mb-1 mt-0">
                                    ✓ {b}
                                </Text>
                            ))}

                            <Hr className="border-gray-100 my-6" />

                            <Text className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-4 leading-6">
                                {t.ctaTitle}
                            </Text>
                            <Section className="mb-3">
                                <Button
                                    href={CHECKOUT_URL}
                                    className="bg-[#3A0B22] text-white text-sm font-semibold px-6 py-4 rounded-md no-underline"
                                >
                                    {t.ctaBtn}
                                </Button>
                            </Section>
                            <Text className="text-base text-gray-600 leading-7 mt-4">{t.deadline}</Text>

                            <Hr className="border-gray-100 my-6" />

                            <Text className="text-sm font-bold text-gray-500 tracking-wider uppercase mb-2 leading-6">
                                {t.guaranteeTitle}
                            </Text>
                            <Text className="text-base text-gray-800 leading-7">{t.guarantee}</Text>

                            {/* Signature */}
                            <Text className="text-base text-gray-700 mt-10 leading-7">
                                — Mostafa
                            </Text>

                            <Text className="text-sm text-gray-600 leading-7 mt-4 italic">{t.ps}</Text>

                            <Text className="text-sm text-gray-600 leading-7 mt-4">
                                {t.referralText}{' '}
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

export default DripEmail1;
