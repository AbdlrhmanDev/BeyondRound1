import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Providers } from '@/providers/Providers';
import TranslationsProvider from '@/components/TranslationsProvider';
import initTranslations from '@/i18n';

const i18nNamespaces = ['common', 'auth', 'dashboard', 'settings', 'notifications'];

export default async function AppLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect(`/${locale}/auth`);

  const { resources } = await initTranslations(locale, i18nNamespaces);

  return (
    <TranslationsProvider
      locale={locale}
      namespaces={i18nNamespaces}
      resources={resources}
    >
      <Providers>
        {children}
      </Providers>
    </TranslationsProvider>
  );
}
