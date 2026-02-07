import { NextResponse } from 'next/server';
import { emailService } from '@/services/emailService';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        console.log('API Route: Received whitelist request for', email);

        if (!email) {
            console.error('API Route: Missing email in request');
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const result = await emailService.sendWhitelistConfirmation(email);

        if (result.success) {
            console.log('API Route: Email sent successfully through service');
            return NextResponse.json({ success: true });
        } else {
            console.error('API Route: Service failed to send email', result.error);
            return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 });
        }
    } catch (error) {
        console.error('Whitelist notification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
