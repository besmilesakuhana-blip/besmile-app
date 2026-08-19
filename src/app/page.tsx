import Link from 'next/link';
import Script from 'next/script';
import { PrismaClient } from '@prisma/client';
import ContactForm from '@/app/components/ContactForm';
import AnalyticsTracker from '@/app/components/AnalyticsTracker';

const prisma = new PrismaClient();

// 毎回DBへアクセスするのを防ぐため、60秒間キャッシュを保持
export const revalidate = 60;

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string' || !url) return false;
  if (url.startsWith('data:video/')) return true;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(cleanUrl);
};

export default async function HomePage() {
  let topSetting = null;
  let recentWorks: any[] = [];

  try {
    topSetting = await prisma.topSetting.findUnique({
      where: { id: 'top_settings' },
    });

    recentWorks = await prisma.work.findMany({
      where: { creatorId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        title: true,
        category: true,
        imageUrl: true,
        creatorId: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('データ取得エラー:', error);
  }

  const heroTitle = topSetting?.heroTitle || 'クリエイターとして働く。\n企業の力になる。';
  const leadDescription = topSetting?.aboutDescription || 'BeSmileは、WEB制作・動画・DTP・イラスト・Other（3D、ゲーム、音源など）を行うクリエイター特化型の就労継続支援A型事業所です。';

  let headerLogoType = 'text';
  let footerLogoType = 'text';
  let headerLogoText = 'BeSmile';
  let instagramUrl = 'https://www.instagram.com/besmile_higashimikuni/?hl=ja';
  let twitterUrl = 'https://x.com/bsma13a';

  let categoryCounts = {
    web: 5,
    movie: 5,
    dtp: 3,
    illust: 10,
    other: 5,
    dateNote: '※2026年7月付',
  };

  if (topSetting?.heroSubtitle) {
    try {
      const parsed = JSON.parse(topSetting.heroSubtitle);
      headerLogoType = parsed.headerLogoType || 'text';
      footerLogoType = parsed.footerLogoType || 'text';
      headerLogoText = parsed.headerLogoText || 'BeSmile';

      if (parsed.instagramUrl) instagramUrl = parsed.instagramUrl;
      if (parsed.twitterUrl) twitterUrl = parsed.twitterUrl;

      if (parsed.web !== undefined || parsed.movie !== undefined) {
        categoryCounts = { ...categoryCounts, ...parsed };
      }
    } catch (e) {}
  }

  const totalCreators =
    Number(categoryCounts.web || 0) +
    Number(categoryCounts.movie || 0) +
    Number(categoryCounts.dtp || 0) +
    Number(categoryCounts.illust || 0) +
    Number(categoryCounts.other || 0);

  const headerLogoUrl = topSetting?.aboutTitle || '/icons/top.png';
  const footerLogoUrl = topSetting?.footerLogoUrl || '/icons/top.png';
  const footerLogoText = topSetting?.footerLogoText || 'BeSmile';
  const footerComment = topSetting?.aboutDescription || '動画・DTP・イラスト・WEB制作・Otherを行うクリエイター特化型の就労継続支援A型事業所';

  let heroImages = [
    '/assets/images/top-main-web.jpg',
    '/assets/images/top-main-movie.jpg',
    '/assets/images/top-main-dtp.jpg',
    '/assets/images/top-main-illust.jpg',
    '/assets/images/top-main-other.jpg',
  ];
  if (topSetting?.mainImageUrl) {
    try {
      const parsed = JSON.parse(topSetting.mainImageUrl);
      if (Array.isArray(parsed) && parsed.length > 0) {
        heroImages = parsed.concat(heroImages).slice(0, 5);
      }
    } catch (e) {}
  }

  return (
    <>
      <AnalyticsTracker />

      <link rel="stylesheet" href="/assets/css/style.css" />

      {/* ヘッダー */}
      <header className="site-header" id="header">
        <div className="header-inner">
          <Link className="brand flex items-center gap-2" href="/" aria-label="BeSmile TOP">
            {headerLogoType === 'image' ? (
              <img src={headerLogoUrl} alt="ロゴ" className="h-10 object-contain" />
            ) : (
              <span className="brand-main">{headerLogoText}</span>
            )}
            <span className="brand-sub">Creative Support Team</span>
          </Link>
          <nav className="global-nav" aria-label="グローバルナビ">
            <Link href="/artists">CREATOR</Link>
            <a href="#contact">CONTACT</a>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero section-bg">
          <div className="container hero-grid hero-grid-revised">
            <div className="hero-copy">
              <p className="eyebrow">Creative Support Team</p>
              <h1>
                CREATORS<br />
                WORK.<br />
                <span>COMPANIES<br />GROW.</span>
              </h1>

              <h2 className="whitespace-pre-wrap">{heroTitle}</h2>
              <p className="lead">{leadDescription}</p>

              <div className="button-row">
                <Link className="btn btn-dark" href="/artists">
                  CREATORを見る <span>→</span>
                </Link>
                <a className="btn btn-blue" href="#contact">
                  お問い合わせ <span>→</span>
                </a>
              </div>
            </div>
            <div className="hero-mosaic" aria-label="制作ジャンルイメージ">
              <div className="mosaic-item mosaic-web"><img src={heroImages[0]} alt="WEB制作イメージ" /></div>
              <div className="mosaic-item mosaic-movie"><img src={heroImages[1]} alt="動画制作イメージ" /></div>
              <div className="mosaic-item mosaic-dtp"><img src={heroImages[2]} alt="DTP制作イメージ" /></div>
              <div className="mosaic-item mosaic-illust"><img src={heroImages[3]} alt="イラスト制作イメージ" /></div>
              <div className="mosaic-item mosaic-other"><img src={heroImages[4]} alt="Other制作イメージ" /></div>
            </div>
          </div>
        </section>

        {/* クリエイター数表示セクション */}
        <section className="bg-white border-y border-gray-100 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
              <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-200 pb-6 lg:pb-0 lg:pr-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">クリエイター数</h2>
                <p className="text-sm font-medium text-gray-700">
                  BeSmileには、<strong className="text-base text-gray-900 font-bold">{totalCreators}名</strong>のクリエイターが在籍しています。
                </p>
                {categoryCounts.dateNote && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">{categoryCounts.dateNote}</p>
                )}
              </div>

              <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="border-r border-gray-100 last:border-0 pr-2">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">WEB制作</span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-3xl md:text-4xl font-extrabold text-gray-900">{categoryCounts.web}</span>
                    <span className="text-xs font-bold text-gray-600">名</span>
                  </div>
                </div>

                <div className="border-r border-gray-100 last:border-0 pr-2">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">動画制作</span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-3xl md:text-4xl font-extrabold text-gray-900">{categoryCounts.movie}</span>
                    <span className="text-xs font-bold text-gray-600">名</span>
                  </div>
                </div>

                <div className="border-r border-gray-100 last:border-0 pr-2">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">DTP制作</span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-3xl md:text-4xl font-extrabold text-gray-900">{categoryCounts.dtp}</span>
                    <span className="text-xs font-bold text-gray-600">名</span>
                  </div>
                </div>

                <div className="border-r border-gray-100 last:border-0 pr-2">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">イラスト制作</span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-3xl md:text-4xl font-extrabold text-gray-900">{categoryCounts.illust}</span>
                    <span className="text-xs font-bold text-gray-600">名</span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Other</span>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-3xl md:text-4xl font-extrabold text-gray-900">{categoryCounts.other}</span>
                    <span className="text-xs font-bold text-gray-600">名</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PORTFOLIO */}
        <section className="portfolio section-bg" id="portfolio">
          <div className="container">
            <div className="section-head split-head">
              <div>
                <p className="num">02</p>
                <h2>PORTFOLIO</h2>
                <p>在籍クリエイターの制作実績をご紹介します。</p>
              </div>
              <Link className="btn btn-outline" href="/artists">
                すべてのCREATORを見る <span>→</span>
              </Link>
            </div>
            <p className="news-label">新着情報</p>
            <div className="work-grid">
              {recentWorks.length > 0 ? (
                recentWorks.map((work) => {
                  const creatorName = work.creator?.name || '';
                  const creatorId = work.creatorId || work.creator?.id;
                  const imageUrl = work.imageUrl || '/icons/works.png';
                  const hrefUrl = `/harenowa?id=${creatorId}`;

                  return (
                    <Link key={work.id} className="work-card group" href={hrefUrl}>
                      <div
                        className="w-full h-52 rounded-md p-3 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]"
                        style={{ backgroundColor: '#C5C5C5' }}
                      >
                        {isVideoUrl(imageUrl) ? (
                          <video src={imageUrl} autoPlay loop muted playsInline style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                          <img src={imageUrl} alt={work.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        )}
                      </div>
                      <h3 className="mt-3 text-base font-bold text-gray-800 truncate">{creatorName}</h3>
                      <p className="text-xs text-gray-500 font-medium truncate">
                        {work.category || '制作実績'} / {work.title}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-gray-400">現在、表示できる制作実績はありません。</div>
              )}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="contact" id="contact">
          <div className="container contact-grid">
            <div className="space-y-6">
              <div className="section-head">
                <p className="num">03</p>
                <h2>CONTACT</h2>
                <p>お仕事のご相談・お見積りなど、<br />お気軽にお問い合わせください。</p>
              </div>

              {/* 制作相談・見学案内画像カード */}
              <div className="relative overflow-hidden w-full h-80 md:h-96">
                <img
                  src="/assets/images/top-contact-bg.jpg"
                  alt="制作相談・見学受付中"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 p-6 flex items-center justify-center">
                  <div className="bg-white/70 p-6 md:p-10 border border-blue-400/50 text-center max-w-sm w-full shadow-xs">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 leading-snug">
                      制作相談・見学も受付中です
                    </h3>
                    <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                      制作の流れやご相談内容に合わせて、担当スタッフが丁寧にご案内いたします。初めてのご依頼でも安心してお問い合わせください。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="site-footer" id="footer">
        <div className="container footer-grid items-center">
          <div>
            <Link className="footer-brand font-bold text-2xl" href="/">
              {footerLogoType === 'image' ? (
                <img src={footerLogoUrl} alt="フッターロゴ" className="h-10 object-contain mb-2" />
              ) : (
                footerLogoText
              )}
            </Link>
            <p className="whitespace-pre-wrap mt-2">{footerComment}</p>
            <a className="footer-url" href="https://sunplace-osaka.com/">https://sunplace-osaka.com/</a>
          </div>

          <div className="flex flex-wrap items-center gap-6 md:gap-8 justify-end">
            <nav className="footer-nav">
              <Link href="/artists">CREATOR</Link>
              <a href="#contact">CONTACT</a>
            </nav>

            {/* SNSボタン (動的リンク) */}
            <div className="flex items-center gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full border border-white flex items-center justify-center text-white hover:opacity-70 transition-opacity"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="w-10 h-10 rounded-full border border-white flex items-center justify-center text-white hover:opacity-70 transition-opacity"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="container footer-bottom">
          <small>© BeSmile All Rights Reserved.</small>
        </div>
      </footer>

      <Script src="/assets/js/main.js" strategy="lazyOnload" />
    </>
  );
}