import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Hr,
    Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface PaymentEmailProps {
    amount?: string;
    date?: string;
    invoiceUrl?: string;
}

export const PaymentEmail = ({
    amount = '$0.00',
    date = new Date().toLocaleDateString(),
    invoiceUrl = '#'
}: PaymentEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Payment confirmed – thank you</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto py-10 px-5 max-w-xl">
                        <Section className="mb-8">
                            <Heading className="text-2xl font-bold text-gray-900 mb-4 text-center">
                                Payment Confirmed
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed text-center mb-8">
                                Thank you for your payment. Your subscription is now active.
                            </Text>

                            <Section className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100">
                                <Section className="mb-4 flex justify-between">
                                    <Text className="text-gray-500 font-medium m-0">Amount Paid</Text>
                                    <Section className="text-right">
                                        <Text className="text-gray-900 font-bold m-0">{amount}</Text>
                                    </Section>
                                </Section>
                                <Hr className="border-gray-200 my-4" />
                                <Section className="mb-4 flex justify-between">
                                    <Text className="text-gray-500 font-medium m-0">Date</Text>
                                    <Section className="text-right">
                                        <Text className="text-gray-900 m-0">{date}</Text>
                                    </Section>
                                </Section>
                                <Hr className="border-gray-200 my-4" />
                                <Section className="flex justify-between">
                                    <Text className="text-gray-500 font-medium m-0">Payment Method</Text>
                                    <Section className="text-right">
                                        <Text className="text-gray-900 m-0">Card (via Stripe)</Text>
                                    </Section>
                                </Section>
                            </Section>

                            <Section className="text-center mb-8">
                                <Link
                                    href={invoiceUrl}
                                    className="bg-black text-white font-semibold py-3 px-6 rounded-md no-underline inline-block"
                                >
                                    Download Invoice
                                </Link>
                            </Section>

                            <Text className="text-gray-500 text-sm text-center">
                                Need more details? Access all your billing history in your
                                <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`} className="text-blue-600 ml-1">Account Settings</Link>.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default PaymentEmail;
