import { useNavigate } from "react-router-dom";
import { useLocale } from "@/contexts/LocaleContext";

/**
 * Returns a navigate function that prepends current locale to internal paths.
 * Use for programmatic navigation (e.g. after login) so user stays in same language.
 */
export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const { pathWithLocale } = useLocale();

  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      navigate(to);
      return;
    }
    if (to.startsWith("http") || to.startsWith("mailto:")) {
      window.location.href = to;
      return;
    }
    navigate(pathWithLocale(to), options as { replace?: boolean });
  };
}
