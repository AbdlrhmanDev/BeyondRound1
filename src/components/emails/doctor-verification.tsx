import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
    Button,
} from '@react-email/components';
import * as React from 'react';

interface DoctorVerificationProps {
    approved: boolean;
    firstName: string;
    locale?: string;
}

const t = {
    en: {
        approvedPreview: 'Your BeyondRounds verification has been approved',
        rejectedPreview: 'Update on your BeyondRounds verification',
        approvedTitle: 'Verification approved!',
        rejectedTitle: 'Verification update',
        greeting: (name: string) => `Hello ${name},`,
        approvedBody: 'Great news! Your doctor verification has been approved. You now have full access to BeyondRounds and can join events in your city.',
        rejectedBody: 'We\'ve reviewed your verification request and unfortunately could not approve it at this time. This may be because the document was unclear, expired, or didn\'t match our requirements.',
        approvedCta: 'Explore BeyondRounds',
        rejectedCta: 'Resubmit Verification',
        rejectedNote: 'If you believe this is a mistake or have questions, please reply to this email.',
        footer: 'The BeyondRounds Team',
    },
    de: {
        approvedPreview: 'Ihre BeyondRounds-Verifizierung wurde genehmigt',
        rejectedPreview: 'Update zu Ihrer BeyondRounds-Verifizierung',
        approvedTitle: 'Verifizierung genehmigt!',
        rejectedTitle: 'Update zur Verifizierung',
        greeting: (name: string) => `Hallo ${name},`,
        approvedBody: 'Großartige Neuigkeiten! Ihre Arztverifizierung wurde genehmigt. Sie haben jetzt vollen Zugang zu BeyondRounds und können an Veranstaltungen in Ihrer Stadt teilnehmen.',
        rejectedBody: 'Wir haben Ihren Verifizierungsantrag geprüft und konnten ihn leider derzeit nicht genehmigen. Dies kann daran liegen, dass das Dokument unleserlich, abgelaufen oder nicht den Anforderungen entsprechend war.',
        approvedCta: 'BeyondRounds erkunden',
        rejectedCta: 'Verifizierung erneut einreichen',
        rejectedNote: 'Wenn Sie glauben, dass dies ein Fehler ist oder Fragen haben, antworten Sie bitte auf diese E-Mail.',
        footer: 'Das BeyondRounds Team',
    },
};

export const DoctorVerificationEmail = ({ approved, firstName, locale = 'en' }: DoctorVerificationProps) => {
    const c = locale === 'de' ? t.de : t.en;
    const appUrl = 'https://www.beyondrounds.app';

    return (
        <Html>
            <Head />
            <Preview>{approved ? c.approvedPreview : c.rejectedPreview}</Preview>
            <Tailwind>
                <Body className="bg-[#f4f4f5] font-sans">
                    <Container className="mx-auto py-12 px-5 max-w-xl">
                        <Section className="bg-[#3A0B22] rounded-t-[12px] px-10 py-5">
                            <Text className="text-white font-bold text-lg m-0">BeyondRounds</Text>
                        </Section>
                        <Section className="bg-white border border-[#E8DED5] rounded-b-[12px] p-10 text-center shadow-sm">
                            <Heading className="text-3xl font-bold text-[#3A0B22] mb-6 tracking-tight">
                                {approved ? c.approvedTitle : c.rejectedTitle}
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-6 text-left">
                                {c.greeting(firstName)}
                            </Text>
                            {approved ? (
                                <>
                                    <Text className="text-gray-700 text-base leading-relaxed mb-8 text-left">
                                        {c.approvedBody}
                                    </Text>
                                    <Section className="mb-8">
                                        <Button
                                            href={appUrl}
                                            className="bg-[#F27C5C] text-white py-4 px-8 rounded-full font-bold text-center no-underline"
                                        >
                                            {c.approvedCta}
                                        </Button>
                                    </Section>
                                </>
                            ) : (
                                <>
                                    <Text className="text-gray-700 text-base leading-relaxed mb-6 text-left">
                                        {c.rejectedBody}
                                    </Text>
                                    <Section className="mb-6">
                                        <Button
                                            href={`${appUrl}/verification`}
                                            className="bg-[#F27C5C] text-white py-4 px-8 rounded-full font-bold text-center no-underline"
                                        >
                                            {c.rejectedCta}
                                        </Button>
                                    </Section>
                                    <Text className="text-gray-500 text-sm italic mb-8">
                                        {c.rejectedNote}
                                    </Text>
                                </>
                            )}
                            <Section className="border-t border-[#E8DED5] pt-8">
                                <Text className="text-[#3A0B22] font-semibold text-base m-0">
                                    {c.footer}
                                </Text>
                            </Section>
                        </Section>
                        <Text className="text-center text-gray-400 text-xs mt-8">
                            © 2026 BeyondRounds Berlin
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default DoctorVerificationEmail;
