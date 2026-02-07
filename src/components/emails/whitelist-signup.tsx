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
} from '@react-email/components';
import * as React from 'react';

export const WhitelistEmail = () => {
    return (
        <Html>
            <Head />
            <Preview>You’re on the whitelist!</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto py-10 px-5 max-w-xl text-center">
                        <Section className="mb-8">
                            <Heading className="text-3xl font-bold text-gray-900 mb-6">
                                You’re on the whitelist! 🎉
                            </Heading>
                            <Section className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
                                <Text className="text-blue-900 text-lg font-medium m-0">
                                    Your spot is secured.
                                </Text>
                            </Section>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-4 text-left">
                                Thank you for your interest! We've added you to our exclusive whitelist.
                                We're currently rolling out access in batches to ensure the best experience for everyone.
                            </Text>
                            <Heading className="text-xl font-semibold text-gray-800 mb-2 text-left">
                                What happens next?
                            </Heading>
                            <Text className="text-gray-700 text-base leading-relaxed mb-4 text-left">
                                1. Our team will review your application. <br />
                                2. You'll receive an invitation link when your batch is ready. <br />
                                3. We expect the next batch to be invited within the next 2-4 weeks.
                            </Text>
                            <Text className="text-gray-500 text-sm italic text-left">
                                Stay tuned for more updates in your inbox!
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WhitelistEmail;
