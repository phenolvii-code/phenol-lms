import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PHENOL | Dr. Omar Magdi — «مَن فَهِمَ شَيْئًا مَلَكَهُ»",
  description: "منصة PHENOL التعليمية المتخصصة في الكيمياء بإشراف Dr. Omar Magdi. «من فهم شيئًا ملكه» — Find the Simple. Master the Complex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-ivory-200 text-charcoal-900 antialiased selection:bg-burgundy-500 selection:text-ivory-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}
