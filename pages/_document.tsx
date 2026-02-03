import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Minimal _document for Pages Router compatibility.
 * App Router uses app/layout.tsx - this satisfies Next.js build when it checks for _document.
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
