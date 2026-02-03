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
  const { t } = useTranslation();
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
    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateContactForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      toast({
        title: t("contact.validationError"),
        description: t("contact.fixErrors"),
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
          title: t("contact.messageSent"),
          description: t("contact.replyWithin"),
        });

        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({ name: "", email: "", subject: "", message: "" });
          setIsSubmitted(false);
        }, 3000);
      } else {
        toast({
          title: t("contact.failedToSend"),
          description: result.error || t("contact.tryAgain"),
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = handleError(error, 'Contact Form');
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.name.trim() && formData.email.trim() && formData.subject.trim() && formData.message.trim() && !isSubmitting;

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <main className="pt-32">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Mail size={14} className="text-primary" />
                {t("contact.getInTouch")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                {t("contact.contactUs")} <span className="text-gradient-gold">Us</span>
              </h1>
              <p className="text-xl text-primary-foreground/60">
                {t("contact.subtitle")}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Information */}
              <div className="space-y-8">
                <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8">
                  <h2 className="font-display text-2xl font-bold text-primary-foreground mb-6">
                    {t("contact.letsConnect")}
                  </h2>
                  <p className="text-primary-foreground/60 mb-8 leading-relaxed">
                    {t("contact.intro")}
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-sm flex-shrink-0">
                        <Mail className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-primary-foreground mb-2">{t("contact.email")}</h3>
                        <div className="space-y-1.5 text-sm">
                          <p><span className="text-primary-foreground/50">General:</span>{" "}
                            <a href={`mailto:${EMAILS.info}`} className="text-primary-foreground/60 hover:text-primary transition-colors">{EMAILS.info}</a>
                          </p>
                          <p><span className="text-primary-foreground/50">Support:</span>{" "}
                            <a href={`mailto:${EMAILS.support}`} className="text-primary-foreground/60 hover:text-primary transition-colors">{EMAILS.support}</a>
                          </p>
                          <p><span className="text-primary-foreground/50">Contact:</span>{" "}
                            <a href={`mailto:${EMAILS.contact}`} className="text-primary-foreground/60 hover:text-primary transition-colors">{EMAILS.contact}</a>
                          </p>
                          <p><span className="text-primary-foreground/50">Team:</span>{" "}
                            <a href={`mailto:${EMAILS.team}`} className="text-primary-foreground/60 hover:text-primary transition-colors">{EMAILS.team}</a>
                          </p>
                          <p><span className="text-primary-foreground/50">Billing:</span>{" "}
                            <a href={`mailto:${EMAILS.billing}`} className="text-primary-foreground/60 hover:text-primary transition-colors">{EMAILS.billing}</a>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-sm flex-shrink-0">
                        <Phone className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-primary-foreground mb-1">{t("contact.responseTime")}</h3>
                        <p className="text-primary-foreground/60">
                          {t("contact.responseTimeDesc")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-sm flex-shrink-0">
                        <MapPin className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-primary-foreground mb-1">{t("contact.location")}</h3>
                        <p className="text-primary-foreground/60">
                          {t("contact.locationDesc")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ Link */}
                <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-6">
                  <h3 className="font-display font-semibold text-primary-foreground mb-2">
                    {t("contact.beforeReachOut")}
                  </h3>
                  <p className="text-primary-foreground/60 text-sm mb-4">
                    {t("contact.checkFaq")}
                  </p>
                  <LocalizedLink to="/faq">
                    <Button variant="outline" className="w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                      {t("contact.visitFaq")}
                    </Button>
                  </LocalizedLink>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 lg:p-10">
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-glow-sm">
                      <CheckCircle className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-primary-foreground mb-3">
                      Message Sent!
                    </h3>
                    <p className="text-primary-foreground/60">
                      We've received your message and will get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-base font-medium text-primary-foreground/70 mb-2 block">
                        {t("contact.fullName")}
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Dr. Jane Smith"
                        required
                        className={`h-14 bg-background/10 border-primary-foreground/20 text-foreground placeholder:text-muted-foreground rounded-2xl ${
                          errors.name ? 'border-destructive' : !formData.name.trim() ? 'border-primary/50' : ''
                        }`}
                      />
                      {errors.name && (
                        <p className="text-destructive text-xs mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-base font-medium text-primary-foreground/70 mb-2 block">
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
                        className={`h-14 bg-background/10 border-primary-foreground/20 text-foreground placeholder:text-muted-foreground rounded-2xl ${
                          errors.email ? 'border-destructive' : !formData.email.trim() ? 'border-primary/50' : ''
                        }`}
                      />
                      {errors.email && (
                        <p className="text-destructive text-xs mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="subject" className="text-base font-medium text-primary-foreground/70 mb-2 block">
                        {t("contact.subjectRequired")}
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="How can we help?"
                        required
                        className={`h-14 bg-background/10 border-primary-foreground/20 text-foreground placeholder:text-muted-foreground rounded-2xl ${
                          errors.subject ? 'border-destructive' : !formData.subject.trim() ? 'border-primary/50' : ''
                        }`}
                      />
                      {errors.subject && (
                        <p className="text-destructive text-xs mt-1">{errors.subject}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="message" className="text-base font-medium text-primary-foreground/70 mb-2 block">
                        {t("contact.messageRequired")}
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more about your question or feedback..."
                        required
                        rows={6}
                        className={`bg-background/10 border-primary-foreground/20 text-foreground placeholder:text-muted-foreground rounded-2xl resize-none ${
                          errors.message ? 'border-destructive' : !formData.message.trim() ? 'border-primary/50' : ''
                        }`}
                      />
                      {errors.message && (
                        <p className="text-destructive text-xs mt-1">{errors.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="w-full h-14 font-semibold group disabled:opacity-50 shadow-glow-sm hover:shadow-glow transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t("contact.sending")}
                        </>
                      ) : (
                        <>
                          {t("contact.sendMessage")}
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
