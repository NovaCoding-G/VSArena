import { IBM_Plex_Mono, Outfit } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { getRequestLocale } from "@/lib/i18n/server";
import { rootMetadata } from "@/lib/seo";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getRequestLocale();

  return (
    <html lang={locale} className="dark">
      <body className={`${outfit.variable} ${plexMono.variable} flex min-h-screen flex-col bg-arena-bg antialiased`}>
        <LocaleProvider locale={locale}>
          <SiteChrome>{children}</SiteChrome>
        </LocaleProvider>
      </body>
    </html>
  );
}
