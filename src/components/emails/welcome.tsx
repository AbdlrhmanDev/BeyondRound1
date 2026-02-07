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
    Img,
    Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
    name?: string;
}

export const WelcomeEmail = ({ name = 'there' }: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to our platform!</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto py-10 px-5 max-w-xl">
                        <Section className="mb-8">
                            <Heading className="text-2xl font-bold text-gray-900 mb-4">
                                Welcome, {name}!
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-4">
                                We're excited to have you on board. Your account has been successfully created and you're ready to start exploring.
                            </Text>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-6">
                                Our platform helps you connect and thrive in a professional community.
                                Whether you're looking for projects or team members, you're in the right place.
                            </Text>
                            <Section className="text-center">
                                <Link
                                    href={process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com/dashboard'}
                                    className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md no-underline inline-block"
                                >
                                    Go to Dashboard
                                </Link>
                            </Section>
                        </Section>
                        <Section className="border-t border-gray-200 pt-8">
                            <Text className="text-gray-500 text-sm">
                                If you have any questions, feel free to reply to this email or contact our support team at
                                <Link href="mailto:support@yourdomain.com" className="text-blue-600 ml-1">support@yourdomain.com</Link>.
                            </Text>
                            <Text className="text-gray-500 text-sm mt-4">
                                © {new Date().getFullYear()} Your Company. All rights reserved.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WelcomeEmail;
