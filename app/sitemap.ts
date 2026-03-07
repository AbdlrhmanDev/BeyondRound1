import type { MetadataRoute } from 'next';

const BASE_URL = 'https://beyondrounds.app';
const locales = ['de', 'en'];

const marketingPages = [
  '',
  '/about',
  '/contact',
  '/faq',
  '/for-doctors',
  '/learn-more',
  '/pricing',
  '/terms',
  '/privacy',
  '/impressum',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of marketingPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'weekly' : 'monthly',
        priority: page === '' ? 1.0 : 0.8,
        alternates: {
          languages: {
            de: `${BASE_URL}/de${page}`,
            en: `${BASE_URL}/en${page}`,
          },
        },
      });
    }
  }

  return entries;
}
