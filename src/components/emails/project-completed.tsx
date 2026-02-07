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
    Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface ProjectCompletedEmailProps {
    projectName?: string;
    dashboardUrl?: string;
}

export const ProjectCompletedEmail = ({
    projectName = 'Project',
    dashboardUrl = 'https://yourdomain.com/dashboard'
}: ProjectCompletedEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>✅ Project completed and ready to use</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="mx-auto py-10 px-5 max-w-xl">
                        <Section className="mb-8 pb-8 border-b border-gray-100">
                            <Heading className="text-2xl font-bold text-green-700 mb-4">
                                ✅ Project Completed
                            </Heading>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-4">
                                Great news! The project <strong>{projectName}</strong> has been marked as completed and is ready for use.
                            </Text>
                            <Text className="text-gray-700 text-lg leading-relaxed mb-6">
                                You and your team can now access the project deliverables and start using it immediately.
                            </Text>
                            <Section className="text-center">
                                <Link
                                    href={dashboardUrl}
                                    className="bg-green-600 text-white font-semibold py-3 px-6 rounded-md no-underline inline-block"
                                >
                                    View Project on Dashboard
                                </Link>
                            </Section>
                        </Section>
                        <Section className="text-gray-500 text-sm">
                            <Text className="m-0">
                                This is a group notification sent to all project stakeholders.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ProjectCompletedEmail;
