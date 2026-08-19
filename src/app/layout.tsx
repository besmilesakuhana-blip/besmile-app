import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🔄 データベースからサイトタイトルとファビコンURLを動的に取得してメタデータを生成
export async function generateMetadata(): Promise<Metadata> {
  try {
    const setting = await prisma.setting.findFirst();
    const siteTitle = setting?.siteTitle || "BE SMILE";
    const faviconUrl = setting?.mainImageUrl || "/icons/top.png";

    return {
      title: siteTitle,
      description: "BeSmile クリエイター特化型就労継続支援A型事業所",
      icons: {
        icon: faviconUrl,
        shortcut: faviconUrl,
        apple: faviconUrl,
      },
    };
  } catch (error) {
    return {
      title: "BE SMILE",
      icons: {
        icon: "/icons/top.png",
      },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}