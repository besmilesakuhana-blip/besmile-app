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

// 管理画面で変更したタイトル・ファビコンが本番に即時反映されるように設定
export const dynamic = "force-dynamic";

// 🔄 データベースからサイトタイトルとファビコンURLを動的に取得してメタデータを生成
export async function generateMetadata(): Promise<Metadata> {
  try {
    const setting = await prisma.setting.findFirst();
    const siteTitle = setting?.siteTitle || "BE SMILE";
    const faviconUrl = setting?.mainImageUrl || "/icons/top.png";
    const description =
      setting?.heroSubtitle ||
      "BeSmile（ビースマイル）は映像・グラフィック・Web制作を行うクリエイター特化型の就労継続支援A型事業所です。";

    return {
      // ブラウザのタブ名 ＆ Google検索の青い大見出しリンクに表示
      title: {
        default: siteTitle,
        template: `%s | ${siteTitle}`,
      },
      description: description,

      // ファビコン（タブのアイコン）
      icons: {
        icon: [
          {
            url: faviconUrl,
          },
        ],
        shortcut: faviconUrl,
        apple: faviconUrl,
      },

      // SNSシェア・Googleリッチリザルト用（OGP）
      openGraph: {
        title: siteTitle,
        description: description,
        siteName: siteTitle,
        images: [
          {
            url: faviconUrl,
            width: 800,
            height: 800,
            alt: siteTitle,
          },
        ],
        locale: "ja_JP",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: siteTitle,
        description: description,
        images: [faviconUrl],
      },
    };
  } catch (error) {
    return {
      title: "BE SMILE",
      description: "BeSmile クリエイター特化型就労継続支援A型事業所",
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