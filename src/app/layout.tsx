import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phenol Academy | First-Principles Academic Institution — Dr. Omar Magdi",
  description: "Phenol Academy — An elite academic institution dedicated to first-principles scientific cognition, rigorous mechanism-first learning, and higher scientific education.",
  icons: {
    icon: "/icon.png",
  },
  verification: {
    google: "DrcWnU6B0QUeJ5YHToKSV8X-jg9MBBzOlFPhsE9Umvo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="google-site-verification" content="DrcWnU6B0QUeJ5YHToKSV8X-jg9MBBzOlFPhsE9Umvo" />
      </head>
      <body className="bg-ivory-200 text-charcoal-900 antialiased selection:bg-burgundy-500 selection:text-ivory-100 min-h-screen">
        {children}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
