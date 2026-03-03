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

interface AdminAlertProps {
    type: 'new_signup' | 'payment_failed' | 'booking_created';
    details: Record<string, string>;
}

const titles: Record<AdminAlertProps['type'], string> = {
    new_signup: '🆕 New signup',
    payment_failed: '⚠️ Payment failed',
    booking_created: '📅 New booking',
};

const previews: Record<AdminAlertProps['type'], string> = {
    new_signup: 'New user signed up on BeyondRounds',
    payment_failed: 'A payment failed on BeyondRounds',
    booking_created: 'A new booking was created on BeyondRounds',
};

export const AdminAlertEmail = ({ type, details }: AdminAlertProps) => {
    const entries = Object.entries(details);

    return (
        <Html>
            <Head />
            <Preview>{previews[type]}</Preview>
            <Tailwind>
                <Body className="bg-[#f4f4f5] font-sans">
                    <Container className="mx-auto py-12 px-5 max-w-xl">
                        <Section className="bg-white border border-gray-200 rounded-[12px] p-8 shadow-sm">
                            <Heading className="text-2xl font-bold text-gray-900 mb-2">
                                {titles[type]}
                            </Heading>
                            <Text className="text-gray-500 text-sm mb-6">
                                BeyondRounds Admin Alert
                            </Text>
                            {/* Key-value table */}
                            <Section className="bg-gray-50 border border-gray-200 rounded-[8px] p-4">
                                {entries.map(([key, value]) => (
                                    <Row key={key} className="mb-2">
                                        <Column className="w-2/5">
                                            <Text className="text-gray-500 text-sm font-medium m-0 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </Text>
                                        </Column>
                                        <Column className="w-3/5">
                                            <Text className="text-gray-900 text-sm m-0">
                                                {value}
                                            </Text>
                                        </Column>
                                    </Row>
                                ))}
                            </Section>
                            <Text className="text-gray-400 text-xs mt-6 m-0">
                                Sent automatically by BeyondRounds
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default AdminAlertEmail;
