/**
 * Drip Email 2 — "One question"
 * Sent: ~3 days after signup (2 days after Email 1)
 * EN subject: "One question so we match you correctly"
 * DE subject: "Eine Frage, damit wir Sie besser matchen können"
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
    locale?: string;
    unsubUrl?: string;
}

export const DripEmail2 = ({
    locale = 'en',
    unsubUrl = 'https://beyondrounds.app/en/unsubscribe',
}: DripEmail2Props) => {
    const isDe = locale === 'de';
    const loc = isDe ? 'de' : 'en';
    const feedbackLink = `https://beyondrounds.app/${loc}/feedback?q=social_blocker`;

    const t = {
        preview: isDe
            ? 'Eine Frage, damit wir Sie besser matchen können'
            : 'One question so we match you correctly',
        greeting: isDe ? 'Hallo Doktor,' : 'Hi Doctor,',
        intro: isDe ? 'Eine kurze Frage:' : 'One quick question:',
        question: isDe
            ? 'Was hindert Sie in Berlin aktuell am meisten am sozialen Leben?'
            : "What's the biggest thing blocking you socially in Berlin right now?",
        optionA: isDe ? 'A) Unvorhersehbarer Dienstplan' : 'A) Unpredictable schedule',
        optionB: isDe ? 'B) Weiß nicht, wo man Leute treffen kann' : "B) Don't know where to meet people",
        optionC: isDe ? 'C) Nach der Arbeit zu müde' : 'C) Too tired after work',
        optionD: isDe ? 'D) Sprachbarriere' : 'D) Language barrier',
        optionE: isDe ? 'E) Schon versucht, hat nicht funktioniert' : "E) Tried already, didn't work",
        ctaBtn: isDe ? 'Antwort senden \u2192' : 'Send your answer \u2192',
        body: isDe
            ? 'Das hilft uns, Gruppen zu bilden, die für Ärzte wirklich funktionieren.'
            : 'This helps us build groups that actually work for doctors.',
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
                            <Text className="text-base text-gray-900 font-semibold leading-7">
                                {t.question}
                            </Text>

                            {/* Options box */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-6">
                                <Text className="m-0 mb-4 text-base text-gray-700 leading-8">
                                    {t.optionA}<br />
                                    {t.optionB}<br />
                                    {t.optionC}<br />
                                    {t.optionD}<br />
                                    {t.optionE}
                                </Text>
                                <Button
                                    href={feedbackLink}
                                    className="bg-[#3A0B22] text-white text-sm font-semibold px-5 py-3 rounded-md no-underline"
                                >
                                    {t.ctaBtn}
                                </Button>
                            </Section>

                            <Text className="text-base text-gray-800 leading-7">{t.body}</Text>

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

export default DripEmail2;
