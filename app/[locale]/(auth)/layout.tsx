import { getDictionary } from '@/lib/i18n/get-dictionary';
import { I18nProvider } from '@/providers/I18nProvider';
import { Providers } from '@/providers/Providers';
import type { Locale } from '@/lib/i18n/settings';

export default async function AuthLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const dictionary = await getDictionary(locale as Locale);
  return (
    <I18nProvider locale={locale as Locale} dictionary={dictionary}>
      <Providers>
        <div className="min-h-screen min-h-[100dvh] overflow-y-auto">
          {children}
        </div>
      </Providers>
    </I18nProvider>
  );
}
