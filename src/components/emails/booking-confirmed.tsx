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
    Row,
    Column,
} from '@react-email/components';
import * as React from 'react';

interface BookingConfirmedProps {
    eventDate: string;
    eventTime: string;
    venue: string;
    city: string;
    action: 'confirmed' | 'changed' | 'canceled';
    locale?: string;
}

const t = {
    en: {
        confirmed: {
            preview: 'Your BeyondRounds booking is confirmed',
            title: 'Booking confirmed!',
            body: 'Your spot is reserved. We look forward to seeing you at the event.',
        },
        changed: {
            preview: 'Your BeyondRounds booking has been updated',
            title: 'Booking updated',
            body: 'Your booking details have been updated. Please review the new details below.',
        },
        canceled: {
            preview: 'Your BeyondRounds booking has been canceled',
            title: 'Booking canceled',
            body: 'Your booking has been canceled. If you have any questions, please contact us.',
        },
        date: 'Date',
        time: 'Time',
        venue: 'Venue',
        city: 'City',
        footer: 'The BeyondRounds Team',
    },
    de: {
        confirmed: {
            preview: 'Ihre BeyondRounds-Buchung ist bestätigt',
            title: 'Buchung bestätigt!',
            body: 'Ihr Platz ist reserviert. Wir freuen uns, Sie bei der Veranstaltung zu sehen.',
        },
        changed: {
            preview: 'Ihre BeyondRounds-Buchung wurde aktualisiert',
            title: 'Buchung aktualisiert',
            body: 'Ihre Buchungsdetails wurden aktualisiert. Bitte überprüfen Sie die neuen Details unten.',
        },
        canceled: {
            preview: 'Ihre BeyondRounds-Buchung wurde storniert',
            title: 'Buchung storniert',
            body: 'Ihre Buchung wurde storniert. Wenn Sie Fragen haben, kontaktieren Sie uns bitte.',
        },
        date: 'Datum',
        time: 'Uhrzeit',
        venue: 'Veranstaltungsort',
        city: 'Stadt',
        footer: 'Das BeyondRounds Team',
    },
};

export const BookingConfirmedEmail = ({ eventDate, eventTime, venue, city, action, locale = 'en' }: BookingConfirmedProps) => {
    const c = locale === 'de' ? t.de : t.en;
    const variant = c[action];

    const accentColor = action === 'canceled' ? 'bg-red-50 border-red-200' : action === 'changed' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200';

    return (
        <Html>
            <Head />
            <Preview>{variant.preview}</Preview>
            <Tailwind>
                <Body className="bg-[#f4f4f5] font-sans">
                    <Container className="mx-auto py-12 px-5 max-w-xl">
                        <Section className="bg-[#3A0B22] rounded-t-[12px] px-10 py-5">
                            <Text className="text-white font-bold text-lg m-0">BeyondRounds</Text>
                        </Section>
                        <Section className="bg-white border border-[#E8DED5] rounded-b-[12px] p-10 shadow-sm">
                            <Heading className="text-3xl font-bold text-[#3A0B22] mb-6 tracking-tight text-center">
                                {variant.title}
                            </Heading>
                            <Text className="text-gray-700 text-base leading-relaxed mb-6">
                                {variant.body}
                            </Text>
                            {/* Event details box */}
                            <Section className={`${accentColor} border rounded-[12px] p-6 mb-8`}>
                                <Row className="mb-3">
                                    <Column className="w-1/2">
                                        <Text className="text-gray-500 text-sm m-0">{c.date}</Text>
                                    </Column>
                                    <Column className="w-1/2">
                                        <Text className="text-gray-900 font-semibold text-sm m-0">{eventDate}</Text>
                                    </Column>
                                </Row>
                                <Row className="mb-3">
                                    <Column className="w-1/2">
                                        <Text className="text-gray-500 text-sm m-0">{c.time}</Text>
                                    </Column>
                                    <Column className="w-1/2">
                                        <Text className="text-gray-900 font-semibold text-sm m-0">{eventTime}</Text>
                                    </Column>
                                </Row>
                                <Row className="mb-3">
                                    <Column className="w-1/2">
                                        <Text className="text-gray-500 text-sm m-0">{c.venue}</Text>
                                    </Column>
                                    <Column className="w-1/2">
                                        <Text className="text-gray-900 font-semibold text-sm m-0">{venue}</Text>
                                    </Column>
                                </Row>
                                <Row>
                                    <Column className="w-1/2">
                                        <Text className="text-gray-500 text-sm m-0">{c.city}</Text>
                                    </Column>
                                    <Column className="w-1/2">
                                        <Text className="text-gray-900 font-semibold text-sm m-0">{city}</Text>
                                    </Column>
                                </Row>
                            </Section>
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

export default BookingConfirmedEmail;
