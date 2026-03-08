'use client';

import { EMAILS } from "@/constants/emails";

// ── Company data (sourced from Companies House certificate + register) ────────
const LEGAL_ENTITY   = 'Sabri Solutions Ltd';
const LEGAL_FORM     = 'Private Limited Company (Ltd.) nach dem Recht von England und Wales';
const TRADING_AS     = 'BeyondRounds';
const STREET         = '71-75 Shelton Street, Covent Garden';
const POSTAL_CITY    = 'London, WC2H 9JQ';
const COUNTRY        = 'Vereinigtes Königreich';
const DIRECTOR_NAME  = 'Mostafa Mohamed';
const COMPANIES_HOUSE_NUMBER = '17004990';
// VAT ID: fill in once registered with HMRC (UK) or Finanzamt (DE)
const VAT_ID         = '[FILL IN: GB- oder DE-USt-IdNr. nach Registrierung]';
// Phone: optional but recommended for Impressum
const PHONE          = '[FILL IN: +49 … oder +44 …]';

const hasMissingFields = [VAT_ID, PHONE].some(f => f.startsWith('[FILL IN'));

const Impressum = () => {
  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">Impressum</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-4">
            Impressum
          </h1>
          <p className="text-sm text-[#5E555B]">Angaben gemäß § 5 TMG</p>
        </div>
      </section>

      {/* Dev warning — visible only when fields are missing */}
      {hasMissingFields && (
        <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-6">
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5">
            <p className="font-semibold text-amber-800 text-sm mb-1">Aktion erforderlich vor dem Launch</p>
            <p className="text-amber-700 text-sm">
              Suche im Code nach <code className="bg-amber-100 px-1 rounded">[FILL IN]</code> in{' '}
              <code className="bg-amber-100 px-1 rounded">src/views/Impressum.tsx</code> und trage die fehlenden Pflichtangaben ein.
              Ohne vollständiges Impressum drohen Abmahnungen.
            </p>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)] space-y-10">

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">Angaben zum Unternehmen</h2>
            <div className="text-[#5E555B] text-sm leading-relaxed space-y-1.5">
              <p className="font-semibold text-[#3A0B22]">{TRADING_AS} ({LEGAL_ENTITY})</p>
              <p>{LEGAL_FORM}</p>
              <p>{STREET}</p>
              <p>{POSTAL_CITY}</p>
              <p>{COUNTRY}</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">Vertreten durch</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">{DIRECTOR_NAME}</p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">Kontakt</h2>
            <div className="text-[#5E555B] text-sm leading-relaxed space-y-1.5">
              <p>
                E-Mail:{" "}
                <a href={`mailto:${EMAILS.contact}`} className="text-[#F27C5C] hover:underline font-medium">
                  {EMAILS.contact}
                </a>
              </p>
              <p>Telefon: {PHONE}</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">Registereintrag</h2>
            <div className="text-[#5E555B] text-sm leading-relaxed space-y-1.5">
              <p>Registergericht: Companies House, Cardiff, England und Wales</p>
              <p>Registernummer: {COMPANIES_HOUSE_NUMBER}</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">Umsatzsteuer-ID</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: {VAT_ID}
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <div className="text-[#5E555B] text-sm leading-relaxed space-y-1.5">
              <p>{DIRECTOR_NAME}</p>
              <p>{STREET}, {POSTAL_CITY}</p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">Online-Streitbeilegung (ODR)</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F27C5C] hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
              . Unsere E-Mail-Adresse finden Sie oben. Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">Haftungsausschluss</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[#3A0B22] text-sm mb-2">Haftung für Inhalte</h3>
                <p className="text-[#5E555B] text-sm leading-relaxed">
                  Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[#3A0B22] text-sm mb-2">Haftung für Links</h3>
                <p className="text-[#5E555B] text-sm leading-relaxed">
                  Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">Urheberrecht</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Impressum;
