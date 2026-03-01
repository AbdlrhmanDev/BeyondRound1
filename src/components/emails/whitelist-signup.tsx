import {
    Body,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface WhitelistEmailProps {
    firstName?: string;
    referralLink?: string;
    locale?: string;
}

export const WhitelistEmail = ({ 
    firstName = 'Doctor', 
    referralLink = '[Referral Link]',
    locale = 'en'
}: WhitelistEmailProps) => {
    const isDe = locale === 'de';

    const content = {
        preview: isDe ? 'Sie sind auf der BeyondRounds Early-Access-Liste' : 'You’re on the BeyondRounds early access list',
        greeting: isDe ? `Hallo ${firstName},` : `Hi ${firstName},`,
        in: isDe ? 'Sie sind dabei.' : 'You’re in.',
        intro: isDe 
            ? 'BeyondRounds ist eine verifizierte Community nur für Ärzte in Berlin. Wir öffnen den Zugang in kleinen Wellen, um die Qualität der Matches hoch zu halten.'
            : 'BeyondRounds is a verified doctors-only community in Berlin. We’re opening access in small waves to keep matching quality high.',
        nextStepsTitle: isDe ? 'Was als Nächstes passiert:' : 'What happens next:',
        nextStep1: isDe ? 'Wir senden Ihnen eine E-Mail, sobald ein Platz frei wird' : 'We’ll email you when a spot opens',
        nextStep2: isDe ? 'Sie verifizieren sich einmal (schnell + privat)' : 'You’ll verify once (quick + private)',
        nextStep3: isDe ? 'Sie erhalten Ihre erste Match-Gruppe' : 'You’ll get your first match group',
        optional: isDe ? 'Optional: Möchten Sie einem Kollegen helfen?' : 'Optional: want to help a colleague?',
        share: isDe ? 'Teilen Sie diesen Link:' : 'Share this link:',
        signoffTitle: isDe ? 'Gründer, BeyondRounds' : 'Founder, BeyondRounds'
    };

    return (
        <Html>
            <Head />
            <Preview>{content.preview}</Preview>
            <Tailwind>
                <Body className="bg-white font-sans text-gray-900">
                    <Container className="mx-auto py-10 px-5 max-w-xl">
                        <Section>
                            <Text className="text-base text-[#1C1917] leading-relaxed mb-4">
                                {content.greeting}
                            </Text>
                            <Text className="text-base text-[#1C1917] font-semibold leading-relaxed mb-4">
                                {content.in}
                            </Text>
                            <Text className="text-base text-[#1C1917] leading-relaxed mb-6">
                                {content.intro}
                            </Text>
                            
                            <Text className="text-base text-[#1C1917] font-medium mb-2">
                                {content.nextStepsTitle}
                            </Text>
                            <Section className="pl-4 mb-6">
                                <ul className="text-base text-[#1C1917] leading-relaxed m-0 p-0 pl-4 space-y-1">
                                    <li>{content.nextStep1}</li>
                                    <li>{content.nextStep2}</li>
                                    <li>{content.nextStep3}</li>
                                </ul>
                            </Section>

                            <Text className="text-base text-[#1C1917] leading-relaxed mb-6">
                                <strong>{content.optional}</strong><br />
                                {content.share} <a href={referralLink} className="text-[#F26449] underline">{referralLink}</a>
                            </Text>

                            <Text className="text-base text-[#57534E] leading-relaxed mt-8">
                                — Mostafa<br />
                                {content.signoffTitle}
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WhitelistEmail;
