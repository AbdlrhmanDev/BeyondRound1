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

interface EventReminderProps {
    eventDate: string;
    eventTime: string;
    venue: string;
    city: string;
    hoursUntil: 24 | 2;
    locale?: string;
}

const t = {
    en: {
        preview24: 'Reminder: your BeyondRounds event is tomorrow',
        preview2: 'Reminder: your BeyondRounds event starts in 2 hours',
        title24: 'See you tomorrow!',
        title2: 'Your event starts in 2 hours',
        greeting: 'Hello,',
        body24: 'Just a reminder that your BeyondRounds event is tomorrow. We can\'t wait to see you there!',
        body2: 'Your event is starting soon. Head over to the venue — we look forward to meeting you!',
        date: 'Date',
        time: 'Time',
        venue: 'Venue',
        city: 'City',
        footer: 'The BeyondRounds Team',
    },
    de: {
        preview24: 'Erinnerung: Ihr BeyondRounds-Event ist morgen',
        preview2: 'Erinnerung: Ihr BeyondRounds-Event beginnt in 2 Stunden',
        title24: 'Bis morgen!',
        title2: 'Ihr Event beginnt in 2 Stunden',
        greeting: 'Hallo,',
        body24: 'Nur zur Erinnerung: Ihr BeyondRounds-Event findet morgen statt. Wir freuen uns darauf, Sie zu sehen!',
        body2: 'Ihr Event beginnt bald. Begeben Sie sich zum Veranstaltungsort — wir freuen uns auf Sie!',
        date: 'Datum',
        time: 'Uhrzeit',
        venue: 'Veranstaltungsort',
        city: 'Stadt',
        footer: 'Das BeyondRounds Team',
    },
};

export const EventReminderEmail = ({ eventDate, eventTime, venue, city, hoursUntil, locale = 'en' }: EventReminderProps) => {
    const c = locale === 'de' ? t.de : t.en;
    const is2h = hoursUntil === 2;
    const urgencyBg = is2h ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200';

    return (
        <Html>
            <Head />
            <Preview>{is2h ? c.preview2 : c.preview24}</Preview>
            <Tailwind>
                <Body className="bg-[#f4f4f5] font-sans">
                    <Container className="mx-auto py-12 px-5 max-w-xl">
                        <Section className="bg-[#3A0B22] rounded-t-[12px] px-10 py-5">
                            <Text className="text-white font-bold text-lg m-0">BeyondRounds</Text>
                        </Section>
                        <Section className="bg-white border border-[#E8DED5] rounded-b-[12px] p-10 shadow-sm">
                            <Heading className="text-3xl font-bold text-[#3A0B22] mb-6 tracking-tight text-center">
                                {is2h ? c.title2 : c.title24}
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-4">
                                {c.greeting}
                            </Text>
                            <Text className="text-gray-700 text-base leading-relaxed mb-6">
                                {is2h ? c.body2 : c.body24}
                            </Text>
                            {/* Event details box */}
                            <Section className={`${urgencyBg} border rounded-[12px] p-6 mb-8`}>
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

export default EventReminderEmail;
