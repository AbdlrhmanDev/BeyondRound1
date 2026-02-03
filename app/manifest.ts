import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BeyondRounds - Connect with Fellow Physicians',
    short_name: 'BeyondRounds',
    description: 'A premium social club exclusively for verified medical professionals. Build meaningful friendships beyond the hospital.',
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    categories: ['social', 'lifestyle', 'health'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48 32x32 24x24 16x16',
        type: 'image/x-icon',
        purpose: 'any',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
