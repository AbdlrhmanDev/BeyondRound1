import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { I18nProvider } from '@/providers/I18nProvider';
import { Providers } from '@/providers/Providers';
import type { Locale } from '@/lib/i18n/settings';

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect(`/${locale}/auth`);

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (!roleRow) redirect(`/${locale}/dashboard`);

  const dictionary = await getDictionary(locale as Locale);
  return (
    <I18nProvider locale={locale as Locale} dictionary={dictionary}>
      <Providers>{children}</Providers>
    </I18nProvider>
  );
}
