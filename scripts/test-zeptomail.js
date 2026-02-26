
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Manually parse .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        env[match[1]] = value.trim();
    }
});

async function testSMTP() {
    console.log('--- SMTP Diagnostic ---');
    console.log('Host:', env.ZEPTOMAIL_SMTP_HOST);
    console.log('Port:', env.ZEPTOMAIL_SMTP_PORT);
    console.log('User:', env.ZEPTOMAIL_SMTP_USER);
    console.log('From:', env.ZEPTOMAIL_FROM || env.ZEPTOMAIL_FROM_EMAIL);

    const transporter = nodemailer.createTransport({
        host: env.ZEPTOMAIL_SMTP_HOST,
        port: Number(env.ZEPTOMAIL_SMTP_PORT) || 465,
        secure: (env.ZEPTOMAIL_SMTP_PORT === '465'),
        auth: {
            user: env.ZEPTOMAIL_SMTP_USER,
            pass: env.ZEPTOMAIL_SMTP_PASS,
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✓ Connection verified successfully!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: env.ZEPTOMAIL_FROM || env.ZEPTOMAIL_FROM_EMAIL,
            to: 'abdlrhman.dev@gmail.com',
            subject: 'ZeptoMail Diagnostic Test',
            text: 'This is a test email to verify SMTP configuration.',
            html: '<b>This is a test email to verify SMTP configuration.</b>',
        });
        console.log('✓ Test email sent!', info.messageId);
        console.log('Full Response:', JSON.stringify(info, null, 2));
    } catch (error) {
        console.error('✗ SMTP Diagnostic Failed:');
        console.error(error);
        if (error.code === 'EAUTH') {
            console.error('Check your Username and Password/API Key.');
        } else if (error.code === 'ESOCKET') {
            console.error('Check your Host and Port. Port 465 requires secure: true.');
        }
    }
}

testSMTP();
