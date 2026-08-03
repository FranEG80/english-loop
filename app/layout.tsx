import type { Metadata } from "next";
import "./globals.css";
import { getLocalePort } from "@/adapters/adapter-factory";
import { getDictionary } from "@/shared/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "EnglishLoop",
    template: "%s · EnglishLoop",
  },
  description:
    "Refresca, aprende y recuerda tu inglés B1 y B2 con lecciones cortas, práctica escrita y repaso inteligente.",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png" }],
  },
  openGraph: {
    title: "EnglishLoop",
    description:
      "Refresca, aprende y recuerda tu inglés B1 y B2 con lecciones cortas, práctica escrita y repaso inteligente.",
    images: [{ url: "/social/og-cover-art.webp", width: 1200, height: 630 }],
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocalePort().getLocale();
  const dictionary = getDictionary(locale);

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          {dictionary.common.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
