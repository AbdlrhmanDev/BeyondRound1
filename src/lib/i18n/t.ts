/**
 * Server-side translation helper. Use with dictionary from getDictionary().
 * Avoids loading i18next on marketing pages.
 */
export function getT(dict: Record<string, unknown>) {
  return (key: string): string => {
    const parts = key.split('.');
    let current: unknown = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    return typeof current === 'string' ? current : key;
  };
}
