'use client';

import { useTranslation } from "react-i18next";
import { EMAILS } from "@/constants/emails";
import { FileText } from "lucide-react";

const Impressum = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32">
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6">
                <FileText size={14} />
                {t("impressum.legal", "Legal Notice")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-6">
                {t("impressum.title", "Impressum")}
              </h1>
              <p className="text-gray-600">
                {t("impressum.subtitle", "Legal disclosure according to German law")}
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 lg:p-12 space-y-10">

                <section>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
                    {t("impressum.companyTitle", "Company Information")}
                  </h2>
                  <div className="text-gray-600 leading-relaxed space-y-2">
                    <p className="font-semibold text-gray-900">BeyondRounds</p>
                    <p>{t("impressum.address", "Berlin, Germany")}</p>
                    <p>
                      {t("impressum.emailLabel", "Email")}:{" "}
                      <a href={`mailto:${EMAILS.contact}`} className="text-emerald-600 hover:underline font-medium">
                        {EMAILS.contact}
                      </a>
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
                    {t("impressum.representedBy", "Represented by")}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {t("impressum.representative", "The founding team of BeyondRounds")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
                    {t("impressum.disclaimerTitle", "Disclaimer")}
                  </h2>
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {t("impressum.liabilityContent", "Liability for content")}
                      </h3>
                      <p>
                        {t("impressum.liabilityContentBody", "The contents of our pages have been created with the utmost care. However, we cannot guarantee the contents' accuracy, completeness, or topicality. According to statutory provisions, we are furthermore responsible for our own content on these web pages. In this matter, please note that we are not obliged to monitor the transmitted or saved information of third parties, or investigate circumstances pointing to illegal activity.")}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {t("impressum.liabilityLinks", "Liability for links")}
                      </h3>
                      <p>
                        {t("impressum.liabilityLinksBody", "Our offer includes links to external third-party websites. We have no influence on the contents of those websites, therefore we cannot guarantee for those contents. Providers or administrators of linked websites are always responsible for their own contents.")}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
                    {t("impressum.copyrightTitle", "Copyright")}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {t("impressum.copyrightBody", "Contents and compilations published on these websites by the providers are subject to German copyright laws. Reproduction, editing, distribution as well as the use of any kind outside the scope of the copyright law require a written permission of the author or originator.")}
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-4">
                    {t("impressum.contactTitle", "Contact")}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {t("impressum.contactBody", "For any questions or concerns, please reach out to us at")}{" "}
                    <a href={`mailto:${EMAILS.contact}`} className="text-emerald-600 hover:underline font-medium">
                      {EMAILS.contact}
                    </a>
                  </p>
                </section>

              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Impressum;
