import { Mail, MapPin, Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
      { label: "About", href: "/about" },
    ],
    legal: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
    support: [
      { label: "Contact Us", href: "mailto:support@beyondrounds.com" },
      { label: "FAQ", href: "/faq" },
    ],
  };

  return (
    <footer className="bg-foreground relative overflow-hidden border-t border-primary-foreground/10">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/10 blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer */}
        <div className="py-16 lg:py-20 grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-2xl text-primary-foreground">
                BeyondRounds
              </span>
            </Link>
            <p className="text-primary-foreground/50 mb-8 max-w-sm text-lg leading-relaxed">
              Where doctors become friends. A premium social club exclusively for verified medical professionals.
            </p>
            <div className="space-y-3">
              <a
                href="mailto:support@beyondrounds.com"
                className="flex items-center gap-3 text-primary-foreground/50 hover:text-primary-foreground transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center group-hover:border-primary-foreground/20 transition-colors">
                  <Mail size={18} />
                </div>
                <span>support@beyondrounds.com</span>
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/50">
                <div className="w-10 h-10 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <span>Berlin, Germany</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-6">Product</h4>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/50 hover:text-primary-foreground transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-6">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/50 hover:text-primary-foreground transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-6">Support</h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/50 hover:text-primary-foreground transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/30 text-sm">© {currentYear} BeyondRounds. All rights reserved.</p>
          <p className="text-primary-foreground/30 text-sm flex items-center gap-2">
            Made with <span className="text-primary">❤️</span> for doctors, by doctors
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
