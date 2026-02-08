'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm, validateContactForm } from "@/services/contactService";
import { EMAILS } from "@/constants/emails";
import { handleError } from "@/utils/errorHandler";
import LocalizedLink from "@/components/LocalizedLink";

const Contact = () => {
  const { t } = useTranslation('contact');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateContactForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      toast({
        title: t("validationError"),
        description: t("fixErrors"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await submitContactForm(formData);

      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: t("messageSent"),
          description: t("replyWithin"),
        });

        setTimeout(() => {
          setFormData({ name: "", email: "", subject: "", message: "" });
          setIsSubmitted(false);
        }, 3000);
      } else {
        toast({
          title: t("failedToSend"),
          description: result.error || t("tryAgain"),
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = handleError(error, 'Contact Form');
      toast({
        title: t("error", { ns: "common" }),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.name.trim() && formData.email.trim() && formData.subject.trim() && formData.message.trim() && !isSubmitting;

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-32">
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6">
                <Mail size={14} />
                {t("getInTouch")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                {t("contactUs")} <span className="text-emerald-600">Us</span>
              </h1>
              <p className="text-xl text-gray-600">
                {t("subtitle")}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Information */}
              <div className="space-y-8">
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
                  <h2 className="font-display text-2xl font-bold text-gray-900 mb-6">
                    {t("letsConnect")}
                  </h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {t("intro")}
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-gray-900 mb-2">{t("email")}</h3>
                        <div className="space-y-1.5 text-sm">
                          <p><span className="text-gray-500">General:</span>{" "}
                            <a href={`mailto:${EMAILS.info}`} className="text-gray-600 hover:text-emerald-600 transition-colors">{EMAILS.info}</a>
                          </p>
                          <p><span className="text-gray-500">Support:</span>{" "}
                            <a href={`mailto:${EMAILS.support}`} className="text-gray-600 hover:text-emerald-600 transition-colors">{EMAILS.support}</a>
                          </p>
                          <p><span className="text-gray-500">Contact:</span>{" "}
                            <a href={`mailto:${EMAILS.contact}`} className="text-gray-600 hover:text-emerald-600 transition-colors">{EMAILS.contact}</a>
                          </p>
                          <p><span className="text-gray-500">Team:</span>{" "}
                            <a href={`mailto:${EMAILS.team}`} className="text-gray-600 hover:text-emerald-600 transition-colors">{EMAILS.team}</a>
                          </p>
                          <p><span className="text-gray-500">Billing:</span>{" "}
                            <a href={`mailto:${EMAILS.billing}`} className="text-gray-600 hover:text-emerald-600 transition-colors">{EMAILS.billing}</a>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-gray-900 mb-1">{t("responseTime")}</h3>
                        <p className="text-gray-600">
                          {t("responseTimeDesc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-gray-900 mb-1">{t("location")}</h3>
                        <p className="text-gray-600">
                          {t("locationDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ Link */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                  <h3 className="font-display font-semibold text-gray-900 mb-2">
                    {t("beforeReachOut")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {t("checkFaq")}
                  </p>
                  <LocalizedLink to="/faq">
                    <Button variant="outline" className="w-full">
                      {t("visitFaq")}
                    </Button>
                  </LocalizedLink>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 lg:p-10">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">
                      Message Sent!
                    </h3>
                    <p className="text-gray-600">
                      We've received your message and will get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-base font-medium text-gray-900 mb-2 block">
                        {t("fullName")}
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Dr. Jane Smith"
                        required
                        className={`h-14 rounded-xl ${errors.name ? 'border-destructive' : ''}`}
                      />
                      {errors.name && (
                        <p className="text-destructive text-xs mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-base font-medium text-gray-900 mb-2 block">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="doctor@hospital.com"
                        required
                        className={`h-14 rounded-xl ${errors.email ? 'border-destructive' : ''}`}
                      />
                      {errors.email && (
                        <p className="text-destructive text-xs mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="subject" className="text-base font-medium text-gray-900 mb-2 block">
                        {t("subjectRequired")}
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        required
                        className={`h-14 rounded-xl ${errors.subject ? 'border-destructive' : ''}`}
                      />
                      {errors.subject && (
                        <p className="text-destructive text-xs mt-1">{errors.subject}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-base font-medium text-gray-900 mb-2 block">
                        {t("messageRequired")}
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more about your question or feedback..."
                        required
                        rows={6}
                        className={`rounded-xl resize-none ${errors.message ? 'border-destructive' : ''}`}
                      />
                      {errors.message && (
                        <p className="text-destructive text-xs mt-1">{errors.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="w-full h-14 font-semibold group disabled:opacity-50 transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t("sending")}
                        </>
                      ) : (
                        <>
                          {t("sendMessage")}
                          <Send className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;
