import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import LoadingOverlay from "@/components/LoadingOverlay";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pemilu.8ehradioitb.com"),
  title: "Pemilu 8EH Radio ITB 2026",
  description: "Pemilihan Umum 8EH Radio ITB 2026",
  icons: {
    icon: '/8eh.ico',
  },
  openGraph: {
    title: "Pemilu 8EH Radio ITB 2026",
    description: "Pemilihan Umum 8EH Radio ITB 2026",
    url: "https://pemilu.8ehradioitb.com",
    siteName: "8EH Radio ITB",
    images: [
      {
        url: "https://opengraph.b-cdn.net/production/images/926d8e9c-a7a3-40a9-b8b4-0de2a4a36875.png?token=IKNzn_FUcVlq_Gf8fdp7krktgTVanXpsEyg4_LdRG3E&height=630&width=1200&expires=33288947365",
        width: 1200,
        height: 630,
        alt: "Pemilu 8EH Radio ITB 2026",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <LoadingOverlay />
            </Suspense>
            {children}
            <Footer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
