import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHENOL | Dr. Omar Magdi — Academic Chemistry Education",
  description: "PHENOL Academic Chemistry Platform directed by Dr. Omar Magdi. Find the Simple. Master the Complex. First-principles scientific reasoning.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-ivory-200 text-charcoal-900 antialiased selection:bg-burgundy-500 selection:text-ivory-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
