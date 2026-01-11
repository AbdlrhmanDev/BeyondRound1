import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-4 mt-4">
        <div className="bg-primary-foreground/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-2xl shadow-lg">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl text-primary-foreground tracking-tight">
                  BeyondRounds
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="px-4 py-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200 font-medium text-sm rounded-lg hover:bg-primary-foreground/5"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Desktop CTA */}
              <div className="hidden md:flex items-center gap-3">
                {!loading && user ? (
                  <Link to="/dashboard">
                    <Button>
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="ghost" size="sm" className="font-medium text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/onboarding">
                      <Button>
                        Join Now
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 text-primary-foreground rounded-lg hover:bg-primary-foreground/10 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden mx-4 mt-2">
          <div className="bg-primary-foreground/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-2xl shadow-lg p-4 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-3 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 transition-colors duration-200 font-medium rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-white/10">
                {!loading && user ? (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full justify-center">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-center text-white/70 hover:text-white hover:bg-white/10">
                        Log In
                      </Button>
                    </Link>
                    <Link to="/onboarding" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full justify-center">
                        Join Now
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
