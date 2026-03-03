/**
 * Drip Email 3 — "Launch Announcement"
 * Sent: Day 14 — Launch Day
 * EN subject: "🎉 BeyondRounds is live (your access inside)"
 * DE subject: "🎉 BeyondRounds ist live (Ihr Zugang)"
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

interface DripEmail3Props {
    firstName?: string;
    locale?: string;
    unsubUrl?: string;
    profileUrl?: string;
}

const CHECKOUT_URL = 'https://checkout.beyondrounds.app/b/9B68wQfvz275ft23sqbo404';

export const DripEmail3 = ({
    firstName,
    locale = 'en',
    unsubUrl = 'https://app.beyondrounds.app/en/unsubscribe',
    profileUrl,
}: DripEmail3Props) => {
    const isDe = locale === 'de';
    const loc = isDe ? 'de' : 'en';
    const siteUrl = `https://www.beyondrounds.app/${loc}`;
    const appUrl = profileUrl || `https://app.beyondrounds.app/${loc}/auth`;

    const t = {
        preview: isDe
            ? '🎉 BeyondRounds ist live (Ihr Zugang)'
            : '🎉 BeyondRounds is live (your access inside)',
        greeting: isDe
            ? (firstName ? `Hey ${firstName},` : 'Hey,')
            : (firstName ? `Hey ${firstName},` : 'Hey,'),
        headline: isDe ? 'Es passiert.' : "It's happening.",
        launch: isDe
            ? 'BeyondRounds startet HEUTE offiziell.'
            : 'BeyondRounds officially launches TODAY.',
        whatTitle: isDe ? 'WAS DAS FÜR SIE BEDEUTET:' : 'WHAT THIS MEANS FOR YOU:',
        websiteLabel: isDe ? 'Die Website ist live:' : 'The website is live:',
        whatNow: isDe ? "So geht es weiter:" : "Here's what you do now:",
        step1Title: isDe ? 'SCHRITT 1: KONTO ERSTELLEN' : 'STEP 1: CREATE YOUR ACCOUNT',
        step1Btn: isDe ? 'Profil vervollständigen — 5 Minuten' : 'Complete Your Profile — 5 Minutes',
        step1Ask: isDe
            ? '→ Ihre Interessen (was Sie gerne tun)\n→ Ihre Verfügbarkeit (wann Sie frei sind)\n→ Ihr Standort in Berlin\n→ Ein bisschen über Sie'
            : "→ Your interests (what you like to do)\n→ Your availability (when you're free)\n→ Your location in Berlin\n→ A bit about yourself",
        step2Title: isDe ? 'SCHRITT 2: ALS ARZT VERIFIZIEREN' : 'STEP 2: VERIFY YOU\'RE A DOCTOR',
        step2Body: isDe
            ? '→ Approbationsurkunde, ODER\n→ Krankenhaus-Ausweis, ODER\n→ Nachweis der ärztlichen Registrierung'
            : '→ Medical license, OR\n→ Hospital ID, OR\n→ Proof of medical registration',
        step2Note: isDe
            ? '(Hält die Community zu 100% für Ärzte)'
            : '(Keeps the community 100% doctors only)',
        step3Title: isDe ? 'SCHRITT 3: GRÜNDUNGSPREIS SICHERN' : 'STEP 3: LOCK IN YOUR FOUNDING RATE',
        step3Body: isDe
            ? '€9,99/Monat für immer (wenn Sie möchten)\nRegulärer Preis ab heute: €19,99/Monat'
            : '€9.99/month forever (if you want it)\nRegular price after today: €19.99/month',
        step3Btn: isDe ? 'Gründungspreis sichern — €9,99/Monat' : 'Secure Founding Rate — €9.99/Month',
        step4Title: isDe ? 'SCHRITT 4: GEMATCHT WERDEN' : 'STEP 4: GET MATCHED',
        step4Body: isDe
            ? '17. März um 17:00 Uhr — erste Matches werden verschickt.\nSie treffen 3–4 Ärzte mit Ihren Interessen.'
            : 'March 17 at 5 PM — first matches go out.\nYou\'ll meet 3–4 doctors who share your interests.',
        ctaBtn: isDe ? 'Jetzt loslegen — 5 Minuten' : 'Get Started Now — 5 Minutes',
        contact: isDe
            ? 'Fragen? Antworten Sie auf diese E-Mail oder schreiben Sie uns auf Instagram.'
            : 'Questions? Reply to this email or DM us on Instagram.',
        signoff: isDe ? 'Gründer, BeyondRounds' : 'Founder, BeyondRounds',
        ps: isDe
            ? 'P.S. Haben Sie bereits Ihren Gründungspreis gesichert? Melden Sie sich an und vervollständigen Sie Ihr Profil. Das ist alles, was Sie tun müssen.'
            : "P.S. Already secured your founding rate? Log in and complete your profile. That's all you need to do.",
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
                            <Text className="text-xl text-gray-900 font-bold leading-8">{t.headline}</Text>
                            <Text className="text-base text-gray-800 leading-7">{t.launch}</Text>

                            <Text className="text-sm font-bold text-gray-500 tracking-wider uppercase mt-6 mb-2 leading-6">
                                {t.whatTitle}
                            </Text>
                            <Text className="text-base text-gray-800 leading-7 mb-1">
                                {t.websiteLabel}{' '}
                                <Link href={siteUrl} className="text-[#3A0B22] underline">{siteUrl}</Link>
                            </Text>
                            <Text className="text-base text-gray-800 leading-7 mb-6">{t.whatNow}</Text>

                            {/* Step 1 */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-4">
                                <Text className="m-0 mb-3 text-xs font-bold text-gray-500 tracking-wider uppercase leading-6">
                                    {t.step1Title}
                                </Text>
                                <Text className="m-0 mb-4 text-sm text-gray-700 leading-7">
                                    {t.step1Ask.split('\n').map((line, i, arr) => (
                                        <React.Fragment key={i}>
                                            {line}{i < arr.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </Text>
                                <Button
                                    href={appUrl}
                                    className="bg-[#3A0B22] text-white text-sm font-semibold px-5 py-3 rounded-md no-underline"
                                >
                                    {t.step1Btn}
                                </Button>
                            </Section>

                            {/* Step 2 */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-4">
                                <Text className="m-0 mb-3 text-xs font-bold text-gray-500 tracking-wider uppercase leading-6">
                                    {t.step2Title}
                                </Text>
                                <Text className="m-0 mb-2 text-sm text-gray-700 leading-7">
                                    {t.step2Body.split('\n').map((line, i, arr) => (
                                        <React.Fragment key={i}>
                                            {line}{i < arr.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </Text>
                                <Text className="m-0 text-xs text-gray-500 leading-6">{t.step2Note}</Text>
                            </Section>

                            {/* Step 3 */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-4">
                                <Text className="m-0 mb-3 text-xs font-bold text-gray-500 tracking-wider uppercase leading-6">
                                    {t.step3Title}
                                </Text>
                                <Text className="m-0 mb-4 text-sm text-gray-700 leading-7">
                                    {t.step3Body.split('\n').map((line, i, arr) => (
                                        <React.Fragment key={i}>
                                            {line}{i < arr.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </Text>
                                <Button
                                    href={CHECKOUT_URL}
                                    className="bg-[#3A0B22] text-white text-sm font-semibold px-5 py-3 rounded-md no-underline"
                                >
                                    {t.step3Btn}
                                </Button>
                            </Section>

                            {/* Step 4 */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-6">
                                <Text className="m-0 mb-3 text-xs font-bold text-gray-500 tracking-wider uppercase leading-6">
                                    {t.step4Title}
                                </Text>
                                <Text className="m-0 text-sm text-gray-700 leading-7">
                                    {t.step4Body.split('\n').map((line, i, arr) => (
                                        <React.Fragment key={i}>
                                            {line}{i < arr.length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </Text>
                            </Section>

                            <Section className="mb-6">
                                <Button
                                    href={appUrl}
                                    className="bg-[#3A0B22] text-white text-base font-bold px-8 py-4 rounded-md no-underline"
                                >
                                    {t.ctaBtn}
                                </Button>
                            </Section>

                            <Text className="text-base text-gray-800 leading-7">{t.contact}</Text>

                            {/* Signature */}
                            <Text className="text-base text-gray-700 mt-10 leading-7">
                                — Mostafa
                            </Text>

                            <Hr className="border-gray-100 my-6" />

                            <Text className="text-sm text-gray-600 leading-7 italic">{t.ps}</Text>
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
