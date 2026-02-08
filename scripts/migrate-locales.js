const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, '../src/locales');
const OUT_DIR = path.join(__dirname, '../public/locales');
const LOCALES = ['en', 'de'];

// Namespace mapping (key in source JSON -> filename in public/locales/{lng}/)
const NS_MAPPING = {
    common: 'common',
    home: 'landing', // Renaming home -> landing
    auth: 'auth',
    forgotPassword: 'auth', // Merging forgotPassword into auth
    dashboard: 'dashboard',
    settings: 'settings',
    onboarding: 'onboarding',
    about: 'about',
    contact: 'contact',
    faq: 'faq',
    pricing: 'pricing',
    waitlist: 'waitlist',
    notifications: 'notifications',
    pwa: 'common', // Merging pwa into common
    // Add others if they appear in the file but are not listed here
};

// Ensure output directories exist
LOCALES.forEach(lng => {
    const dir = path.join(OUT_DIR, lng);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Process each locale
LOCALES.forEach(lng => {
    const srcFile = path.join(SRC_DIR, `${lng}.json`);
    if (!fs.existsSync(srcFile)) {
        console.error(`Source file not found: ${srcFile}`);
        return;
    }

    console.log(`Processing ${lng}...`);
    const data = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
    const namespaces = {};

    // Initialize namespaces based on mapping values
    Object.values(NS_MAPPING).forEach(ns => {
        namespaces[ns] = {};
    });

    // Distribute keys
    Object.keys(data).forEach(key => {
        const targetNs = NS_MAPPING[key] || 'common'; // Default to common if unknown

        // If target is same as key or it's a simple mapping
        if (!namespaces[targetNs]) {
            namespaces[targetNs] = {};
        }

        // Merge content
        // Note: If multiple source keys map to the same NS (e.g. forgotPassword -> auth), 
        // we need to decide if we keep them nested or flatten. 
        // The user request implied "splitting keys into namespaces". 
        // If I map "forgotPassword" to "auth", do I want `auth.forgotPassword` or just merge?
        // Given the structure `forgotPassword: { title: ... }`, if I merge it into `auth`,
        // it will be `auth: { ..., forgotPassword: { ... } }` which is cleaner to access via `t('forgotPassword.title', { ns: 'auth' })`.

        if (targetNs === 'common' && key === 'pwa') {
            namespaces[targetNs][key] = data[key];
        } else if (targetNs === 'auth' && key === 'forgotPassword') {
            namespaces[targetNs][key] = data[key];
        } else if (targetNs === 'common' && key !== 'common' && key !== 'pwa') {
            // Fallback for unknown keys, keep them under their original key in common
            namespaces[targetNs][key] = data[key];
        } else {
            // For 1:1 mappings (dashboard -> dashboard), we might want to flatten IF the structure allows, 
            // but to minimize code changes in the app (e.g. t('home.headline') becoming t('headline', { ns: 'landing' })),
            // it might be safer to keep the structure OR we assume the user will update calls.

            // HOWEVER, the standard i18next pattern is `ns:key`. 
            // If we have `home: { headline: ... }` and we move it to `landing.json`, 
            // we essentially want `landing.json` to contain `{ headline: ... }`.
            // Then we call `t('headline', { ns: 'landing' })`.
            // If we keep it nested as `{ home: { headline: ... } }` inside `landing.json`, 
            // we'd call `t('home.headline', { ns: 'landing' })`.
            // The former is more idiomatic for namespaces.

            // Let's FLATTEN for the direct mappings where possible.
            if (key === 'home' && targetNs === 'landing') {
                Object.assign(namespaces[targetNs], data[key]);
            } else if (key === targetNs) {
                Object.assign(namespaces[targetNs], data[key]);
            } else {
                // For merges (forgotPassword -> auth), we definitely want to keep the key
                // so it doesn't clash with existing auth keys.
                namespaces[targetNs][key] = data[key];
            }
        }
    });

    // Write files
    Object.keys(namespaces).forEach(ns => {
        const content = namespaces[ns];
        if (Object.keys(content).length > 0) {
            const outFile = path.join(OUT_DIR, lng, `${ns}.json`);
            fs.writeFileSync(outFile, JSON.stringify(content, null, 2));
            console.log(`  Created ${lng}/${ns}.json`);
        }
    });
});

console.log('Migration complete.');
