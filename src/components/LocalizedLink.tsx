import { Link, LinkProps } from "react-router-dom";
import { useLocale } from "@/contexts/LocaleContext";

/**
 * Link that prepends current locale to internal paths. Use for in-app navigation.
 * External URLs (http/https) and hash-only are left unchanged.
 */
const LocalizedLink = ({ to, ...props }: LinkProps) => {
  const { pathWithLocale } = useLocale();

  const resolvedTo = (() => {
    if (typeof to === "string") {
      if (to.startsWith("http") || to.startsWith("mailto:") || to === "" || to === "#") return to;
      return pathWithLocale(to);
    }
    if (typeof to === "object" && to !== null && "pathname" in to) {
      const pathname = (to as { pathname?: string }).pathname;
      if (pathname && !pathname.startsWith("http") && pathname !== "" && pathname !== "#") {
        return { ...to, pathname: pathWithLocale(pathname) };
      }
    }
    return to;
  })();

  return <Link to={resolvedTo} {...props} />;
};

export default LocalizedLink;
