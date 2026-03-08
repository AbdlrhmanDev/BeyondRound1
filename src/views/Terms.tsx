'use client';

import Link from "next/link";
import { EMAILS } from "@/constants/emails";
import { useParams } from "next/navigation";

const Terms = () => {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'de';
  const isDE = locale === 'de';
  const l = isDE ? 'de' : 'en';

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
            {isDE ? 'Allgemeine Geschäftsbedingungen' : 'Terms & Conditions'}
          </h1>
          <p className="text-sm text-[#5E555B]">
            {isDE ? 'Zuletzt aktualisiert: März 2026' : 'Last updated: March 2026'}
          </p>
        </div>
      </section>

      {/* Plain-language summary */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-8">
        <div className="bg-[#3A0B22] rounded-[24px] p-8 text-white">
          <h2 className="font-display text-xl font-bold mb-3">
            {isDE ? 'Kurzfassung' : 'The short version'}
          </h2>
          <ul className="space-y-2 text-white/80 text-sm leading-relaxed">
            {(isDE ? [
              "BeyondRounds ist eine Community für verifizierte Ärztinnen und Ärzte, die sich in kleinen Gruppen treffen.",
              "Sei respektvoll, erscheine zu vereinbarten Treffen und behandle andere als Kollegen.",
              "Wir schützen deine Daten und erwarten, dass du die Privatsphäre anderer respektierst.",
              "Du kannst jederzeit kündigen. Kostenlose Stornierung bis Mittwoch 21:00 Uhr (CET).",
            ] : [
              "BeyondRounds is a community for verified doctors to meet in small groups.",
              "Be respectful, show up when you commit, and treat others as peers.",
              "We protect your data and expect you to respect others' privacy.",
              "You can cancel anytime. Free cancellation until Wednesday 9 pm CET.",
            ]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Full Terms */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)] space-y-10">

          {/* 1 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '1. Geltungsbereich und Vertragsschluss' : '1. Acceptance of Terms'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'Durch den Zugriff auf oder die Nutzung von BeyondRounds stimmst du diesen AGB zu. Wenn du nicht einverstanden bist, nutze den Dienst nicht. Wir können diese Bedingungen von Zeit zu Zeit aktualisieren und werden dich über wesentliche Änderungen informieren.'
                : 'By accessing or using BeyondRounds, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our service. We may update these terms from time to time and will notify you of material changes.'}
            </p>
          </div>

          {/* 2 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '2. Voraussetzungen' : '2. Eligibility'}
            </h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {(isDE ? [
                "Du musst approbierter Arzt / approbierte Ärztin sein.",
                "Du musst mindestens 18 Jahre alt sein.",
                "Du musst bei der Registrierung wahrheitsgemäße Angaben machen.",
                "Deine Approbation muss über offizielle Register verifizierbar sein.",
              ] : [
                "You must be a licensed medical doctor.",
                "You must be at least 18 years of age.",
                "You must provide accurate information during registration.",
                "Your medical licence must be verifiable through official registries.",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>

          {/* 3 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '3. Dein Konto' : '3. Your Account'}
            </h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {(isDE ? [
                "Du bist für die Vertraulichkeit deines Kontos verantwortlich.",
                "Du verpflichtest dich, genaue, aktuelle und vollständige Angaben zu machen.",
                "Du musst uns unverzüglich über jede unbefugte Nutzung deines Kontos informieren.",
              ] : [
                "You are responsible for maintaining the confidentiality of your account.",
                "You agree to provide accurate, current, and complete information.",
                "You must notify us immediately of any unauthorised use of your account.",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>

          {/* 4 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '4. Community-Regeln' : '4. Community Standards'}
            </h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {(isDE ? [
                "Behandle alle Mitglieder mit Respekt und Professionalität.",
                "Gib ohne Einwilligung keine personenbezogenen Daten anderer Mitglieder weiter.",
                "Erscheine zu Treffen, zu denen du zugesagt hast, oder storniere fristgerecht.",
                "Melde unangemessenes Verhalten über unsere In-App-Werkzeuge.",
              ] : [
                "Treat all members with respect and professionalism.",
                "Do not share other members' personal information without consent.",
                "Attend meetups you've committed to or cancel before the deadline.",
                "Report any inappropriate behaviour through our in-app tools.",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>

          {/* 5 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '5. Buchungen & Stornierung' : '5. Meetup Reservations'}
            </h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {(isDE ? [
                "Reservierungen werden bei Auswahl eines Wochendtags bestätigt.",
                "Kostenlose Stornierung ist bis Mittwoch 21:00 Uhr (CET) möglich.",
                "Spätstornierungen und Nichterscheinen können zu Kosten führen.",
                "Wir behalten uns vor, Buchungen für Mitglieder mit wiederholtem Nichterscheinen einzuschränken.",
              ] : [
                "Reservations are confirmed upon selection of a weekend day.",
                "Free cancellation is available until Wednesday at 9:00 pm CET.",
                "Late cancellations and no-shows may result in charges.",
                "We reserve the right to limit bookings for members with repeated no-shows.",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>

          {/* 6 — Subscription & billing */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '6. Abonnement, Preise & Mehrwertsteuer' : '6. Subscription, Pricing & VAT'}
            </h2>
            <div className="text-[#5E555B] text-sm leading-relaxed space-y-3">
              <p>
                {isDE
                  ? 'BeyondRounds bietet Mitgliedschaftspläne auf monatlicher oder mehrmonatiger Basis an. Alle Preise sind in Euro angegeben und beinhalten die gesetzliche Mehrwertsteuer (MwSt.) von 19 % gemäß deutschem Steuerrecht.'
                  : 'BeyondRounds offers membership plans on a monthly or multi-month basis. All prices are quoted in euros and include statutory German VAT (MwSt.) of 19%.'}
              </p>
              <ul className="space-y-2">
                {(isDE ? [
                  "Abonnements verlängern sich automatisch am Ende jedes Abrechnungszeitraums.",
                  "Du kannst jederzeit über Einstellungen → Abrechnung kündigen; die Kündigung wirkt zum Ende des laufenden Zeitraums.",
                  "Rückerstattungen werden nach eigenem Ermessen und gemäß geltendem deutschen Verbraucherrecht gewährt.",
                  "Bei Zahlungsausfall behalten wir uns vor, den Zugang zu beschränken, bis die Zahlung erfolgt ist.",
                ] : [
                  "Subscriptions auto-renew at the end of each billing period.",
                  "You can cancel at any time via Settings → Billing; cancellation takes effect at the end of the current period.",
                  "Refunds are granted at our discretion and in accordance with applicable German consumer law.",
                  "In the event of a failed payment, we may restrict access until payment is settled.",
                ]).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 7 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '7. Verbotenes Verhalten' : '7. Prohibited Conduct'}
            </h2>
            <p className="text-[#5E555B] text-sm mb-2">
              {isDE ? 'Du stimmst zu, nicht:' : 'You agree not to:'}
            </p>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {(isDE ? [
                "Den Dienst für rechtswidrige Zwecke zu nutzen.",
                "Andere Mitglieder zu belästigen, zu missbrauchen oder zu schädigen.",
                "Deine Identität oder beruflichen Qualifikationen zu fälschen.",
                "Die Plattform für kommerzielle Werbung oder Networking zu nutzen.",
                "Unseren Verifizierungsprozess zu umgehen.",
              ] : [
                "Use the service for any unlawful purpose.",
                "Harass, abuse, or harm other members.",
                "Misrepresent your identity or professional credentials.",
                "Use the platform for commercial solicitation or networking.",
                "Attempt to circumvent our verification process.",
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>

          {/* 8 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '8. Geistiges Eigentum' : '8. Intellectual Property'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'Alle Inhalte, Funktionen und Merkmale von BeyondRounds sind unser Eigentum und durch Urheber-, Marken- und sonstige Schutzrechte geschützt. Eine Vervielfältigung oder Weitergabe ohne unsere ausdrückliche Genehmigung ist untersagt.'
                : 'All content, features, and functionality of BeyondRounds are owned by us and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our explicit permission.'}
            </p>
          </div>

          {/* 9 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '9. Datenschutz' : '9. Privacy'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? <>Deine Privatsphäre ist uns wichtig. Bitte lies unsere{" "}<Link href={`/${l}/privacy`} className="text-[#F27C5C] hover:underline font-medium">Datenschutzerklärung</Link>, um zu verstehen, wie wir deine personenbezogenen Daten erheben, verwenden und schützen.</>
                : <>Your privacy is important to us. Please review our{" "}<Link href={`/${l}/privacy`} className="text-[#F27C5C] hover:underline font-medium">Privacy Policy</Link>{" "}to understand how we collect, use, and protect your personal information.</>}
            </p>
          </div>

          {/* 10 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '10. Haftungsbeschränkung' : '10. Limitation of Liability'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'BeyondRounds ermöglicht soziale Kontakte, ist jedoch nicht für das Verhalten einzelner Mitglieder verantwortlich. Wir haften nicht für Schäden, die aus der Nutzung des Dienstes oder aus Interaktionen mit anderen Mitgliedern entstehen. Die gesetzliche Haftung für Vorsatz und grobe Fahrlässigkeit bleibt unberührt.'
                : 'BeyondRounds facilitates social connections but is not responsible for the conduct of individual members. We are not liable for any damages arising from your use of the service or interactions with other members. Statutory liability for intent and gross negligence remains unaffected.'}
            </p>
          </div>

          {/* 11 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '11. Kündigung' : '11. Termination'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'Wir können dein Konto nach eigenem Ermessen sperren oder kündigen, wenn du gegen diese AGB oder unsere Community-Regeln verstößt. Du kannst dein Konto jederzeit über Einstellungen → Konto löschen selbst löschen.'
                : 'We may suspend or terminate your account at our discretion if you violate these terms or our community standards. You may delete your account at any time via Settings → Delete account.'}
            </p>
          </div>

          {/* 12 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '12. Anwendbares Recht & Gerichtsstand' : '12. Governing Law'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE
                ? 'Diese AGB unterliegen dem Recht der Bundesrepublik Deutschland. Ausschließlicher Gerichtsstand ist Berlin, soweit gesetzlich zulässig. EU-Verbraucher können sich auch an die Online-Streitbeilegungsplattform der EU wenden: https://ec.europa.eu/consumers/odr'
                : 'These terms are governed by the laws of the Federal Republic of Germany. Any disputes shall be subject to the exclusive jurisdiction of the courts in Berlin, Germany. EU consumers may also use the EU Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr'}
            </p>
          </div>

          {/* 13 */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">
              {isDE ? '13. Kontakt' : '13. Contact'}
            </h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              {isDE ? 'Bei Fragen zu diesen AGB kontaktiere uns unter ' : 'For questions about these terms, contact us at '}
              <a href={`mailto:${EMAILS.contact}`} className="text-[#F27C5C] hover:underline font-medium">{EMAILS.contact}</a>
            </p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Terms;
