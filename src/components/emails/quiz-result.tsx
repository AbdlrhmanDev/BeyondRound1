/**
 * Quiz Result Email
 * Sent immediately after someone completes the Social Health Score quiz.
 * EN + DE supported via locale prop.
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

interface QuizResultEmailProps {
    firstName?: string;
    score?: number;
    locale?: string;
    unsubUrl?: string;
}

function scoreLabel(score: number, isDe: boolean): string {
    if (isDe) {
        if (score <= 30) return 'Noch im Aufbau';
        if (score <= 60) return 'In Entwicklung';
        if (score <= 80) return 'Wachsend';
        return 'Stark';
    }
    if (score <= 30) return 'Still forming';
    if (score <= 60) return 'Developing';
    if (score <= 80) return 'Growing';
    return 'Strong';
}

function scoreMessage(score: number, isDe: boolean): string {
    if (isDe) {
        if (score <= 30) {
            return 'Ihr soziales Fundament in Berlin befindet sich noch im Aufbau — genau dafür ist BeyondRounds gemacht. Wir matchen verifizierte Ärzte in kleine, kuratierte Gruppen, damit Sie wirklich Menschen kennenlernen und keine Kontakte sammeln.';
        }
        if (score <= 60) {
            return 'Sie haben bereits einige Kontakte in Berlin, aber eine echte Freundesgruppe aufzubauen braucht Zeit und das richtige System. BeyondRounds übernimmt die Arbeit: verifizierte Kollegen, kuratierte Gruppen, passende Orte.';
        }
        if (score <= 80) {
            return 'Sie bauen sich ein solides Sozialleben in Berlin auf. BeyondRounds kann Ihnen helfen, tiefer zu gehen — durch verifizierte Kollegen, die die Anforderungen eines Arztberufs wirklich verstehen.';
        }
        return 'Sie haben ein starkes Sozialleben in Berlin. BeyondRounds kann trotzdem einen Mehrwert bieten: verifizierte Kollegen in kuratierten Kleingruppen — Qualität statt Quantität.';
    }

    if (score <= 30) {
        return "Your social foundation in Berlin is still forming — that's exactly what BeyondRounds is built for. We match verified doctors into small curated groups so you actually meet people, not just collect contacts.";
    }
    if (score <= 60) {
        return "You have some connections in Berlin, but building a genuine friend group takes time and the right system. BeyondRounds does the heavy lifting: verified peers, curated groups, suggested venues.";
    }
    if (score <= 80) {
        return "You're building a solid social life in Berlin. BeyondRounds can help you go deeper — meeting verified peers who truly get the demands of a medical career.";
    }
    return "You have a strong social life in Berlin. BeyondRounds can still add value by connecting you with verified peers in curated small groups — quality over quantity.";
}

export const QuizResultEmail = ({
    firstName = 'Doctor',
    score = 0,
    locale = 'en',
    unsubUrl,
}: QuizResultEmailProps) => {
    const isDe = locale === 'de';
    const loc = isDe ? 'de' : 'en';
    const waitlistUrl = `https://beyondrounds.app/${loc}/waitlist`;
    const resolvedUnsubUrl = unsubUrl ?? `https://beyondrounds.app/${loc}/unsubscribe`;

    const label = scoreLabel(score, isDe);
    const message = scoreMessage(score, isDe);
    const scoreColor = score <= 30 ? '#DC2626' : score <= 60 ? '#D97706' : score <= 80 ? '#2563EB' : '#16A34A';

    const t = {
        preview: isDe
            ? `Ihr Social Health Score: ${score}/100 \u2014 ${label}`
            : `Your Social Health Score: ${score}/100 \u2014 ${label}`,
        greeting: isDe ? `Hallo ${firstName},` : `Hi ${firstName},`,
        scoreIntro: isDe ? 'Hier ist Ihr Social Health Score:' : "Here's your Social Health Score:",
        outOf: isDe ? `von 100 \u2014` : `out of 100 \u2014`,
        body: isDe
            ? 'BeyondRounds öffnet in kleinen Wellen. Treten Sie der Early-Access-Liste bei, um als Erster benachrichtigt zu werden, wenn Ihre Welle öffnet.'
            : 'BeyondRounds is opening in small waves. Join the early access list to be first in line when your wave opens.',
        ctaBtn: isDe ? 'Early-Access-Liste beitreten \u2192' : 'Join the early access list \u2192',
        signoff: isDe ? 'Gründer, BeyondRounds' : 'Founder, BeyondRounds',
        footer: isDe
            ? 'Sie erhalten diese E-Mail, weil Sie den BeyondRounds Social Health Score Quiz abgeschlossen haben.'
            : 'You received this because you completed the BeyondRounds Social Health Score quiz.',
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
                            <Text className="text-base text-gray-800 leading-7">{t.scoreIntro}</Text>

                            {/* Score display */}
                            <Section className="text-center py-6 mb-4">
                                <Text
                                    className="text-6xl font-extrabold m-0 leading-none"
                                    style={{ color: scoreColor }}
                                >
                                    {score}
                                </Text>
                                <Text className="text-lg text-gray-500 m-0 mt-1">
                                    {t.outOf} <strong>{label}</strong>
                                </Text>
                            </Section>

                            {/* Interpretation */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-6">
                                <Text className="m-0 text-base text-gray-700 leading-7">
                                    {message}
                                </Text>
                            </Section>

                            <Text className="text-base text-gray-800 leading-7">{t.body}</Text>

                            <Button
                                href={waitlistUrl}
                                className="bg-[#3A0B22] text-white text-sm font-semibold px-6 py-3 rounded-md no-underline mt-2"
                            >
                                {t.ctaBtn}
                            </Button>

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
                                <Link href={resolvedUnsubUrl} className="text-gray-400 underline">{t.unsub}</Link>
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default QuizResultEmail;
