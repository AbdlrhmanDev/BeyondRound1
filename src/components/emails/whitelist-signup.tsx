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

interface WhitelistEmailProps {
    firstName?: string;
    referralLink?: string;
    priorityFormLink?: string;
    unsubUrl?: string;
    locale?: string;
}

export const WhitelistEmail = ({
    firstName = 'Doctor',
    referralLink = 'https://beyondrounds.app',
    priorityFormLink = 'https://beyondrounds.app/en/quiz',
    unsubUrl = 'https://beyondrounds.app/en/unsubscribe',
    locale = 'en',
}: WhitelistEmailProps) => {
    const isDe = locale === 'de';

    const t = {
        preview: isDe
            ? 'Sie sind auf der BeyondRounds Early-Access-Liste'
            : "You're on the BeyondRounds early access list",
        greeting: isDe ? `Hallo ${firstName},` : `Hi ${firstName},`,
        youreIn: isDe ? 'Sie sind dabei.' : "You're in.",
        intro: isDe
            ? 'BeyondRounds ist eine verifizierte Community nur für Ärzte in Berlin. Wir öffnen den Zugang in kleinen Wellen, um die Qualität der Matches hoch zu halten.'
            : "BeyondRounds is a verified doctors-only community in Berlin. We're opening access in small waves to keep matching quality high.",
        nextTitle: isDe ? 'Was als Nächstes passiert:' : 'What happens next:',
        step1: isDe ? 'Wir senden Ihnen eine E-Mail, sobald ein Platz frei wird' : "We'll email you when a spot opens",
        step2: isDe ? 'Sie verifizieren sich einmal (schnell + privat)' : "You'll verify once (quick + private)",
        step3: isDe ? 'Sie erhalten Ihre erste Match-Gruppe' : "You'll get your first match group",
        priorityTitle: isDe
            ? 'Möchten Sie Priority Access?'
            : 'If you want priority access, answer 2 quick questions here:',
        priorityBtn: isDe ? 'Priority-Formular \u2192' : 'Answer 2 quick questions \u2192',
        referralTitle: isDe
            ? 'Optional: Möchten Sie einem Kollegen helfen?'
            : 'Optional: want to help a colleague?',
        referralBody: isDe ? 'Teilen Sie diesen Link:' : 'Share this link:',
        signoff: isDe ? 'Gründer, BeyondRounds' : 'Founder, BeyondRounds',
        footer: isDe
            ? 'Sie erhalten diese E-Mail, weil Sie sich auf der BeyondRounds-Warteliste angemeldet haben.'
            : 'You received this because you joined the BeyondRounds early access list.',
        unsub: isDe ? 'Abmelden' : 'Unsubscribe',
    };

    return (
        <Html>
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
                            <Text className="text-base text-gray-800 leading-7 mt-0">
                                {t.greeting}
                            </Text>
                            <Text className="text-base text-gray-900 font-semibold leading-7">
                                {t.youreIn}
                            </Text>
                            <Text className="text-base text-gray-800 leading-7">
                                {t.intro}
                            </Text>

                            <Text className="text-base text-gray-800 font-medium leading-7 mb-1">
                                {t.nextTitle}
                            </Text>
                            <ul className="mt-0 mb-6 pl-5 text-base text-gray-800 leading-8">
                                <li>{t.step1}</li>
                                <li>{t.step2}</li>
                                <li>{t.step3}</li>
                            </ul>

                            {/* Priority form CTA */}
                            <Section className="bg-[#fdf2f8] border-l-[3px] border-[#3A0B22] rounded-r-lg px-6 py-5 mb-5">
                                <Text className="m-0 mb-4 text-base text-gray-800 leading-7">
                                    {t.priorityTitle}
                                </Text>
                                <Button
                                    href={priorityFormLink}
                                    className="bg-[#3A0B22] text-white text-sm font-semibold px-5 py-3 rounded-md no-underline"
                                >
                                    {t.priorityBtn}
                                </Button>
                            </Section>

                            {/* Referral */}
                            {/* <Text className="text-base text-gray-800 leading-7">
                                <strong>{t.referralTitle}</strong>
                                <br />
                                {t.referralBody}{' '}
                                <a href={referralLink} className="text-[#3A0B22] underline break-all">
                                    {referralLink}
                                </a>
                            </Text> */}

                            {/* Signature */}
                            <Text className="text-base text-gray-700 mt-10 leading-7">
                                — Mostafa
                                <br />
                                <span className="text-sm text-gray-500">{t.signoff}</span>
                            </Text>
                        </Section>

                        {/* Footer */}
                        <Section className="px-9 py-5 border-t border-gray-100">
                            <Text className="m-0 text-xs text-gray-400 leading-5">
                                {t.footer}{' '}
                                <Link href={unsubUrl} className="text-gray-400 underline">
                                    {t.unsub}
                                </Link>
                            </Text>
                        </Section>

                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WhitelistEmail;
