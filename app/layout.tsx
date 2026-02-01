import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google"; 
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; 

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DreamPsyche 2026",
  description: "ระบบทำนายฝัน AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${notoSansThai.variable} font-sans antialiased bg-slate-50`}
      >
        {children}
        <Toaster /> {/* จำเป็นมาก */}
      </body>
    </html>
  );
}