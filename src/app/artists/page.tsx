'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const bgColors = ['#DDE7F3', '#EEE7D5', '#ECE0EE', '#DAE6DC', '#EFDCC9', '#C5C5C5'];
const categories = ['ALL', '動画', 'DTP', 'イラスト', 'WEB', 'Other'];

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string' || !url) return false;
  if (url.startsWith('data:video/')) return true;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(cleanUrl);
};

function ArtistsContent() {
  const searchParams = useSearchParams();
  const highlightWorkId = searchParams.get('highlightWorkId');

  const [creators, setCreators] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [headerLogoType, setHeaderLogoType] = useState('text');
  const [headerLogoUrl, setHeaderLogoUrl] = useState('/icons/top.png');
  const [headerLogoText, setHeaderLogoText] = useState('BeSmile');

  const [footerLogoType, setFooterLogoType] = useState('text');
  const [footerLogoUrl, setFooterLogoUrl] = useState('/icons/top.png');
  const [footerLogoText, setFooterLogoText] = useState('BeSmile');
  const [footerComment, setFooterComment] = useState('');

  const [instagramUrl, setInstagramUrl] = useState('https://www.instagram.com/besmile_higashimikuni/?hl=ja');
  const [twitterUrl, setTwitterUrl] = useState('https://x.com/bsma13a');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCreators, resSettings] = await Promise.all([
          fetch('/api/creators'),
          fetch('/api/settings/header-footer'),
        ]);

        if (resCreators.ok) {
          const data = await resCreators.json();
          setCreators(data);
        }

        if (resSettings.ok) {
          const s = await resSettings.json();
          setHeaderLogoType(s.headerLogoType || 'text');
          setHeaderLogoUrl(s.headerLogoUrl || '/icons/top.png');
          setHeaderLogoText(s.headerLogoText || 'BeSmile');

          setFooterLogoType(s.footerLogoType || 'text');
          setFooterLogoUrl(s.footerLogoUrl || '/icons/top.png');
          setFooterLogoText(s.footerLogoText || 'BeSmile');
          setFooterComment(s.footerComment || '');

          if (s.instagramUrl) setInstagramUrl(s.instagramUrl);
          if (s.twitterUrl) setTwitterUrl(s.twitterUrl);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const allWorks = creators.flatMap((creator) => {
    if (!creator.works || creator.works.length === 0) return [];

    return creator.works.map((work: any) => ({
      id: work.id || `work-${Math.random()}`,
      creatorId: creator.id,
      imageUrl: work.imageUrl || creator.avatarUrl,
      category: work.category || '制作実績',
      creatorName: creator.name,
    }));
  });

  useEffect(() => {
    if (!isLoading && highlightWorkId) {
      setTimeout(() => {
        const element = document.getElementById(`work-card-${highlightWorkId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [isLoading, highlightWorkId]);

  const filteredWorks = allWorks.filter((work) => {
    if (selectedCategory === 'ALL') return true;
    return (work.category || '').includes(selectedCategory);
  });

  return (
    <>
      <link rel="stylesheet" href="/assets/css/style.css" />

      {/* ヘッダー */}
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand flex items-center gap-2" href="/">
            {headerLogoType === 'image' && headerLogoUrl ? (
              <img src={headerLogoUrl} alt="ロゴ" className="h-10 object-contain" />
            ) : (
              <span className="brand-main">{headerLogoText}</span>
            )}
            <span className="brand-sub">Creative Support Team</span>
          </Link>
          <nav className="global-nav">
            <Link href="/artists">CREATOR</Link>
            <Link href="/#contact">CONTACT</Link>
          </nav>
        </div>
      </header>

      <main className="artists-page section-bg">
        <section className="container page-title">
          <h1>CREATOR</h1>
          <p>在籍クリエイターの制作実績を掲載しています。制作ジャンルごとにご覧いただけます。</p>

          <div className="filter-tabs" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'is-active' : ''}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <section className="container artist-grid min-h-[300px]">
          {isLoading ? (
            <div className="col-span-full text-center py-16 text-gray-400">
              作品情報を読み込んでいます...
            </div>
          ) : filteredWorks.length > 0 ? (
            filteredWorks.map((work, index) => {
              const bgColor = bgColors[index % bgColors.length];
              const formattedNo = String(index + 1).padStart(2, '0');
              const isVideo = isVideoUrl(work.imageUrl);
              const isHighlighted = work.id === highlightWorkId;

              return (
                <Link
                  key={work.id}
                  id={`work-card-${work.id}`}
                  className={`artist-card rounded-xl transition-all duration-300 ${
                    isHighlighted ? 'ring-4 ring-amber-400 scale-105 shadow-xl' : ''
                  }`}
                  href={`/harenowa?id=${work.creatorId}&workId=${work.id}`}
                >
                  <div
                    className="artist-thumb p-3 flex items-center justify-center overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02]"
                    style={{ backgroundColor: bgColor, height: '260px', width: '100%' }}
                  >
                    {isVideo ? (
                      <video src={work.imageUrl} autoPlay loop muted playsInline style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <img src={work.imageUrl} alt={work.creatorName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    )}
                  </div>
                  <div className="artist-meta pt-3">
                    <small className="text-xs text-gray-400 font-semibold">{formattedNo}</small>
                    <h2 className="text-lg font-bold text-gray-800">{work.creatorName}</h2>
                    <p className="text-xs text-gray-500 font-medium">{work.category}</p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-16 text-gray-400 text-sm">
              該当する作品がありません。
            </div>
          )}
        </section>
      </main>

      {/* フッター */}
      <footer className="site-footer">
        <div className="container footer-grid items-center">
          <div className="flex flex-col items-start gap-2">
            <Link className="footer-brand font-bold text-2xl inline-block" href="/">
              {footerLogoType === 'image' && footerLogoUrl ? (
                <img src={footerLogoUrl} alt="フッターロゴ" className="h-10 object-contain mb-2" />
              ) : (
                footerLogoText
              )}
            </Link>

            {footerComment && (
              <p className="whitespace-pre-wrap text-sm text-gray-300 mt-1">{footerComment}</p>
            )}

            <a className="footer-url block text-xs text-gray-400 mt-2 hover:underline" href="https://sunplace-osaka.com/">
              https://sunplace-osaka.com/
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-6 md:gap-8 justify-end">
            <nav className="footer-nav">
              <Link href="/artists">CREATOR</Link>
              <Link href="/#contact">CONTACT</Link>
            </nav>

            {/* SNSボタン */}
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
    </>
  );
}

export default function ArtistsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          読み込み中...
        </div>
      }
    >
      <ArtistsContent />
    </Suspense>
  );
}