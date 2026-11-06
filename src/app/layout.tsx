import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phenol | د. عمر مجدي - كيمياء ومواد علمية",
  description: "المنصة التخصصية في شرح الكيمياء والمواد العلمية للدكتور عمر مجدي (Dr. Omar Magdi) - كيمياء عضوية، فيزيائية، وحيوية بهوية برجندي ودهبي راقية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased selection:bg-burgundy-100 selection:text-burgundy-900">
        {children}
      </body>
    </html>
  );
}
