'use client';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Clock, MapPin, Send, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm, validateContactForm } from "@/services/contactService";
import { EMAILS } from "@/constants/emails";
import { handleError } from "@/utils/errorHandler";
import Link from "next/link";

const Contact = () => {
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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateContactForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    try {
      const result = await submitContactForm(formData);
      if (result.success) {
        setIsSubmitted(true);
        toast({ title: "Message sent", description: "We'll get back to you within 24 hours." });
        setTimeout(() => {
          setFormData({ name: "", email: "", subject: "", message: "" });
          setIsSubmitted(false);
        }, 3000);
      } else {
        toast({ title: "Failed to send", description: result.error || "Please try again.", variant: "destructive" });
      }
    } catch (error) {
      const errorMessage = handleError(error, 'Contact Form');
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.name.trim() && formData.email.trim() && formData.subject.trim() && formData.message.trim() && !isSubmitting;

  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">Contact</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-6">
            We'd love to hear from you.
          </h1>
          <p className="text-lg text-[#5E555B] max-w-xl mx-auto leading-relaxed">
            Questions, feedback, or just want to say hello? Drop us a line and we'll get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-5 sm:px-8 max-w-4xl pb-20">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
              <h2 className="font-display text-xl font-bold text-[#3A0B22] mb-6">Get in touch</h2>
              <div className="space-y-5">
                <div className="flex gap-3 items-start">
                  <div className="h-10 w-10 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-[#F27C5C]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3A0B22] text-sm mb-1">Email</p>
                    <a href={`mailto:${EMAILS.contact}`} className="text-sm text-[#5E555B] hover:text-[#F27C5C] transition-colors">{EMAILS.contact}</a>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-10 w-10 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-[#F27C5C]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3A0B22] text-sm mb-1">Response time</p>
                    <p className="text-sm text-[#5E555B]">Within 24 hours, Mon–Fri</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-10 w-10 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-[#F27C5C]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#3A0B22] text-sm mb-1">Location</p>
                    <p className="text-sm text-[#5E555B]">Berlin, Germany</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-[#3A0B22] rounded-[20px] p-6 text-center">
              <p className="text-white/80 text-sm mb-3">Have a common question?</p>
              <Link href="/en/faq" className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-[#F27C5C] hover:bg-[#e06d4d] text-white text-sm font-semibold transition-all active:scale-[0.98]">
                Visit our FAQ
              </Link>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#F27C5C]/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-[#F27C5C]" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#3A0B22] mb-3">Message sent!</h3>
                  <p className="text-[#5E555B]">We've received your message and will get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-[#3A0B22] mb-2 block">Full name</Label>
                    <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Dr. Jane Smith" required className={`h-12 rounded-xl bg-white border-[#E8DED5] ${errors.name ? 'border-red-400' : ''}`} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-[#3A0B22] mb-2 block">Email address</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="doctor@hospital.com" required className={`h-12 rounded-xl bg-white border-[#E8DED5] ${errors.email ? 'border-red-400' : ''}`} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-sm font-medium text-[#3A0B22] mb-2 block">Subject</Label>
                    <Input id="subject" name="subject" type="text" value={formData.subject} onChange={handleChange} placeholder="How can we help?" required className={`h-12 rounded-xl bg-white border-[#E8DED5] ${errors.subject ? 'border-red-400' : ''}`} />
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-[#3A0B22] mb-2 block">Message</Label>
                    <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Tell us more..." required rows={5} className={`rounded-xl bg-white border-[#E8DED5] resize-none ${errors.message ? 'border-red-400' : ''}`} />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>
                  <button type="submit" disabled={!canSubmit} className="w-full h-14 rounded-full bg-[#F27C5C] hover:bg-[#e06d4d] disabled:opacity-50 text-white font-display font-semibold text-base transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                    {isSubmitting ? (<><Loader2 className="h-5 w-5 animate-spin" /> Sending...</>) : (<><Send className="h-4 w-4" /> Send message</>)}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
