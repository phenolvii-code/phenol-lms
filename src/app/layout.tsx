import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr. Omar Magdi | The Chemistry Counselor — من فهم شيئًا ملكه",
  description: "هوية تعليمية متخصصة في تعليم الكيمياء والعلوم للدكتور عمر مجدي. لا تحفظ الكيمياء. افهم كيف تعمل.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-darkBg text-textPrimary antialiased selection:bg-burgundy-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
