'use client';

import { Shield, Lock, Eye, Database } from "lucide-react";
import { EMAILS } from "@/constants/emails";
import { useParams } from "next/navigation";

const Privacy = () => {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'de';
  const isDE = locale === 'de';

  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">
            {isDE ? 'Rechtliches' : 'Legal'}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-4">
            {isDE ? 'Datenschutzerklärung' : 'Privacy Policy'}
          </h1>
          <p className="text-sm text-[#5E555B]">
            {isDE ? 'Zuletzt aktualisiert: März 2026' : 'Last updated: March 2026'}
          </p>
        </div>
      </section>

      {/* Highlight */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-8">
        <div className="bg-[#3A0B22] rounded-[24px] p-8 text-white text-center">
          <Lock className="w-10 h-10 mx-auto mb-4 text-[#F27C5C]" />
          <h2 className="font-display text-xl font-bold mb-3">
            {isDE ? 'Deine Privatsphäre ist uns wichtig' : 'Your privacy matters'}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-lg mx-auto">
            {isDE
              ? 'Wir erheben nur das Notwendige, um dich mit der richtigen Gruppe zu verbinden. Deine Approbation wird sicher gespeichert. Wir verkaufen deine Daten nie an Dritte.'
              : 'We collect only what\'s necessary to match you with the right group. Your medical credentials are verified and stored securely. We never sell your data to third parties.'}
          </p>
        </div>
      </section>

      {/* Full Policy */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)] space-y-10">

          {/* Verantwortlicher / Controller */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '1. Verantwortlicher' : '1. Data Controller'}
            </h2>
            <div className="text-[#5E555B] text-sm leading-relaxed space-y-1">
              <p className="font-semibold text-[#3A0B22]">BeyondRounds</p>
              <p>Berlin, Deutschland</p>
              <p>
                {isDE ? 'E-Mail: ' : 'Email: '}
                <a href={`mailto:${EMAILS.contact}`} className="text-[#F27C5C] hover:underline font-medium">{EMAILS.contact}</a>
              </p>
            </div>
          </div>

          {/* What we collect */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center">
                <Database className="h-4 w-4 text-[#F27C5C]" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#3A0B22]">
                {isDE ? '2. Welche Daten wir erheben' : '2. What we collect'}
              </h2>
            </div>
            <div className="space-y-5 pl-12">
              <div>
                <h3 className="font-semibold text-[#3A0B22] text-sm mb-2">
                  {isDE ? 'Kontodaten' : 'Account information'}
                </h3>
                <ul className="text-[#5E555B] text-sm space-y-1.5 leading-relaxed">
                  {(isDE
                    ? ["Name, E-Mail-Adresse und Geburtsdatum", "Approbationsnummer und ausstellende Behörde", "Profilfoto (optional)", "Stadt und bevorzugte Sprache"]
                    : ["Name, email address, and date of birth", "Medical licence number and issuing authority", "Profile photo (optional)", "City and preferred language"]
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[#3A0B22] text-sm mb-2">
                  {isDE ? 'Präferenzen & Matching' : 'Preferences & matching'}
                </h3>
                <ul className="text-[#5E555B] text-sm space-y-1.5 leading-relaxed">
                  {(isDE
                    ? ["Interessen, Persönlichkeitsmerkmale und soziale Präferenzen", "Wochenendbeschaffenheit und bevorzugter Treffpunktstil", "Feedback und Bewertungen vergangener Treffen", "Kommunikationspräferenzen"]
                    : ["Interests, personality traits, and social preferences", "Weekend availability and preferred meetup style", "Feedback and ratings from past meetups", "Communication preferences"]
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[#3A0B22] text-sm mb-2">
                  {isDE ? 'Nutzungsdaten' : 'Usage data'}
                </h3>
                <ul className="text-[#5E555B] text-sm space-y-1.5 leading-relaxed">
                  {(isDE
                    ? ["Gerätetyp, Browser und Betriebssystem", "Besuchte Seiten und genutzte Funktionen", "Absturzberichte und Performance-Daten"]
                    : ["Device type, browser, and operating system", "Pages visited and features used", "Crash reports and performance data"]
                  ).map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Legal basis */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '3. Rechtsgrundlage der Verarbeitung' : '3. Legal basis for processing'}
            </h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {(isDE ? [
                "Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) — Kontoerstellung, Matching, Buchungen",
                "Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO) — Sicherheit, Betrug­sprävention, Service-Verbesserung",
                "Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) — optionale Analytics- und Marketing-Cookies",
                "Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO) — Aufbewahrungspflichten nach HGB/AO",
              ] : [
                "Contract performance (Art. 6(1)(b) GDPR) — account creation, matching, bookings",
                "Legitimate interests (Art. 6(1)(f) GDPR) — security, fraud prevention, service improvement",
                "Consent (Art. 6(1)(a) GDPR) — optional analytics and marketing cookies",
                "Legal obligation (Art. 6(1)(c) GDPR) — retention duties under German commercial law",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>

          {/* How we use it */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-[#F27C5C]" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#3A0B22]">
                {isDE ? '4. Wie wir deine Daten nutzen' : '4. How we use your data'}
              </h2>
            </div>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {(isDE ? [
                "Um deine ärztliche Approbation zu prüfen und das Vertrauen in der Community zu wahren",
                "Um dich mit kompatiblen Ärztegruppen in deiner Stadt zu matchen",
                "Um Treffen-Details, Updates und wichtige Benachrichtigungen zu senden",
                "Um unseren Matching-Algorithmus und die Servicequalität zu verbessern",
              ] : [
                "To verify your medical credentials and maintain community trust",
                "To match you with compatible groups of doctors in your city",
                "To communicate meetup details, updates, and important notifications",
                "To improve our matching algorithm and overall service quality",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>

          {/* Data processors / DPA */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '5. Auftragsverarbeiter (Drittanbieter)' : '5. Data processors (third parties)'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed mb-4">
              {isDE
                ? 'Wir arbeiten ausschließlich mit DSGVO-konformen Anbietern zusammen und haben mit jedem einen Auftragsverarbeitungsvertrag (AVV) abgeschlossen.'
                : 'We work exclusively with GDPR-compliant providers and have a Data Processing Agreement (DPA) in place with each.'}
            </p>
            <div className="overflow-x-auto rounded-xl border border-[#E8DED5]">
              <table className="w-full text-sm text-[#5E555B]">
                <thead>
                  <tr className="bg-[#F6F1EC] border-b border-[#E8DED5]">
                    <th className="text-left px-4 py-3 font-semibold text-[#3A0B22]">{isDE ? 'Anbieter' : 'Provider'}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#3A0B22]">{isDE ? 'Zweck' : 'Purpose'}</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#3A0B22]">{isDE ? 'Sitz' : 'Location'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DED5]">
                  {[
                    { name: 'Supabase Inc.', purpose: isDE ? 'Datenbank & Authentifizierung' : 'Database & authentication', location: 'USA (SCCs)' },
                    { name: 'Stripe Inc.', purpose: isDE ? 'Zahlungsabwicklung' : 'Payment processing', location: 'USA (SCCs)' },
                    { name: 'Resend Inc.', purpose: isDE ? 'Transaktions-E-Mails' : 'Transactional email', location: 'USA (SCCs)' },
                    { name: 'Brevo (Sendinblue SAS)', purpose: isDE ? 'Marketing-E-Mails' : 'Marketing email', location: 'Frankreich / France' },
                    { name: 'Vercel Inc.', purpose: isDE ? 'Hosting & CDN' : 'Hosting & CDN', location: 'USA (SCCs)' },
                    { name: 'Sentry (Functional Software)', purpose: isDE ? 'Fehlerüberwachung' : 'Error monitoring', location: 'USA (SCCs)' },
                  ].map((row) => (
                    <tr key={row.name} className="hover:bg-[#F6F1EC]/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#3A0B22]">{row.name}</td>
                      <td className="px-4 py-3">{row.purpose}</td>
                      <td className="px-4 py-3">{row.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[#5E555B] text-xs mt-3 leading-relaxed">
              {isDE
                ? 'SCCs = EU-Standardvertragsklauseln gem. Art. 46 Abs. 2 lit. c DSGVO.'
                : 'SCCs = EU Standard Contractual Clauses under Art. 46(2)(c) GDPR.'}
            </p>
          </div>

          {/* How we protect it */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-[#F27C5C]" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#3A0B22]">
                {isDE ? '6. Wie wir deine Daten schützen' : '6. How we protect your data'}
              </h2>
            </div>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {(isDE ? [
                "Alle Daten werden über verschlüsselte Verbindungen übertragen (TLS 1.2+)",
                "Approbationsnachweise werden in verschlüsselten, zugangskontrollierten Datenbanken gespeichert",
                "Regelmäßige Sicherheitsaudits und Schwachstellenanalysen",
                "Zugriff auf personenbezogene Daten ist auf autorisierte Teammitglieder beschränkt",
                "Row-Level Security (RLS) in unserer Datenbank: jede Zeile ist dem jeweiligen Nutzer zugeordnet",
              ] : [
                "All data is transmitted over encrypted connections (TLS 1.2+)",
                "Medical credentials are stored in encrypted, access-controlled databases",
                "Regular security audits and vulnerability assessments",
                "Access to personal data is limited to authorised team members only",
                "Row-Level Security (RLS) in our database: every row is scoped to its owner",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>

          {/* Cookies */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '7. Cookies' : '7. Cookies'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'Wir setzen technisch notwendige Cookies für Authentifizierung und Sitzungsmanagement ein. Optionale Analyse- und Marketing-Cookies werden nur nach deiner ausdrücklichen Einwilligung gesetzt. Du kannst deine Cookie-Einstellungen jederzeit über den Link im Footer anpassen.'
                : 'We use essential cookies for authentication and session management. Optional analytics and marketing cookies are only set after your explicit consent. You can manage your cookie preferences at any time via the link in the footer.'}
            </p>
          </div>

          {/* Your rights */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '8. Deine Rechte (DSGVO Art. 15–22)' : '8. Your rights (GDPR Art. 15–22)'}
            </h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {(isDE ? [
                "Auskunftsrecht (Art. 15): Kopie deiner gespeicherten Daten anfordern",
                "Berichtigungsrecht (Art. 16): Unrichtige oder unvollständige Daten korrigieren lassen",
                "Recht auf Löschung (Art. 17): Löschung deiner Daten verlangen — direkt über Einstellungen → Konto löschen",
                "Recht auf Einschränkung (Art. 18): Verarbeitung einschränken lassen",
                "Recht auf Datenübertragbarkeit (Art. 20): Daten in maschinenlesbarem Format erhalten",
                "Widerspruchsrecht (Art. 21): Verarbeitung auf Basis berechtigter Interessen widersprechen",
              ] : [
                "Right of access (Art. 15): Request a copy of your personal data",
                "Right to rectification (Art. 16): Correct inaccurate or incomplete data",
                "Right to erasure (Art. 17): Request deletion — directly via Settings → Delete account",
                "Right to restriction (Art. 18): Restrict how we process your data",
                "Right to data portability (Art. 20): Receive your data in a machine-readable format",
                "Right to object (Art. 21): Object to processing based on legitimate interests",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>

          {/* Supervisory authority */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '9. Beschwerderecht bei der Aufsichtsbehörde' : '9. Right to lodge a complaint'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'Du hast das Recht, dich bei der zuständigen Datenschutzbehörde zu beschweren. Für Berlin ist dies:'
                : 'You have the right to lodge a complaint with the supervisory authority. For Berlin:'}
            </p>
            <div className="mt-3 text-[#5E555B] text-sm leading-relaxed space-y-0.5 pl-4 border-l-2 border-[#F27C5C]/40">
              <p className="font-semibold text-[#3A0B22]">Berliner Beauftragte für Datenschutz und Informationsfreiheit</p>
              <p>Alt-Moabit 59–61, 10555 Berlin</p>
              <p>
                <a href="https://www.datenschutz-berlin.de" target="_blank" rel="noopener noreferrer" className="text-[#F27C5C] hover:underline">
                  www.datenschutz-berlin.de
                </a>
              </p>
            </div>
          </div>

          {/* Data retention */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '10. Speicherdauer' : '10. Data retention'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'Wir speichern deine Daten, solange dein Konto aktiv ist. Nach Kontolöschung werden personenbezogene Daten innerhalb von 30 Tagen gelöscht. Buchungs- und Zahlungsdaten werden gemäß §§ 147 AO, 257 HGB für 10 Jahre aufbewahrt.'
                : 'We retain your data for as long as your account is active. Upon account deletion, personal data is removed within 30 days. Booking and payment records are retained for 10 years under §§ 147 AO, 257 HGB (German tax and commercial law).'}
            </p>
          </div>

          {/* Children */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '11. Minderjährige' : '11. Children\'s privacy'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'BeyondRounds richtet sich ausschließlich an approbierte Ärztinnen und Ärzte ab 18 Jahren. Wir erheben wissentlich keine Daten von Personen unter 18 Jahren.'
                : 'BeyondRounds is intended for licensed medical professionals aged 18 and older. We do not knowingly collect personal information from individuals under 18.'}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '12. Kontakt & Datenschutzanfragen' : '12. Contact & data requests'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'Für datenschutzrechtliche Fragen oder zur Ausübung deiner Rechte wende dich an '
                : 'For privacy-related questions or to exercise your rights, contact us at '}
              <a href={`mailto:${EMAILS.contact}`} className="text-[#F27C5C] hover:underline font-medium">{EMAILS.contact}</a>
              {isDE ? '. Wir antworten innerhalb von 30 Tagen.' : '. We respond within 30 days.'}
            </p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Privacy;
