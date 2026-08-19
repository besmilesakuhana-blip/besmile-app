'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SUB_IMAGE_MARKER = '___SUB_IMAGES_JSON___:';

const parseWorkDescription = (raw: string) => {
  if (!raw) return { description: '', subImages: [] };
  const pos = raw.indexOf(SUB_IMAGE_MARKER);
  if (pos === -1) return { description: raw, subImages: [] };

  const description = raw.substring(0, pos).trim();
  const jsonPart = raw.substring(pos + SUB_IMAGE_MARKER.length).trim();
  try {
    const parsed = JSON.parse(jsonPart);
    return { description, subImages: Array.isArray(parsed) ? parsed : [] };
  } catch (e) {
    return { description: raw, subImages: [] };
  }
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string' || !url) return false;
  if (url.startsWith('data:video/')) return true;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogv)$/.test(cleanUrl);
};

export default function HarenowaPage() {
  const searchParams = useSearchParams();
  const creatorId = searchParams.get('id');
  const targetWorkId = searchParams.get('workId');

  const [creator, setCreator] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedWork, setSelectedWork] = useState<any>(null);
  const [modalDisplayImage, setModalDisplayImage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    const fetchCreatorDetailAndSettings = async () => {
      try {
        const resCreator = await fetch('/api/creators', { cache: 'no-store' });
        if (resCreator.ok) {
          const data = await resCreator.json();
          if (data && data.length > 0) {
            const target = creatorId
              ? data.find((c: any) => c.id === creatorId) || data[0]
              : data[0];
            setCreator(target);
          }
        }

        const resSettings = await fetch('/api/settings/header-footer', { cache: 'no-store' });
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

    fetchCreatorDetailAndSettings();
  }, [creatorId]);

  useEffect(() => {
    if (!isLoading && targetWorkId) {
      setTimeout(() => {
        const element = document.getElementById(`detail-work-${targetWorkId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [isLoading, targetWorkId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        データを読み込んでいます...
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 gap-4">
        <p>クリエイター情報が見つかりませんでした。</p>
        <Link href="/artists" className="btn btn-blue">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const works = creator.works || [];
  const mainImage = creator.avatarUrl || '/assets/images/harenowa-profile.png';

  const categoryWithSkills = creator.skills
    ? `${creator.role || 'クリエイター'} ${creator.skills}`
    : creator.role || 'クリエイター';

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

      <main className="detail-page section-bg">
        <section className="container detail-hero">
          <div
            className="detail-photo detail-photo-full"
            style={{
              width: '100%',
              height: '420px',
              minHeight: '420px',
              maxHeight: '420px',
              paddingBottom: 0,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#EEE7D5',
              borderRadius: '16px',
              padding: '12px',
              overflow: 'hidden',
            }}
          >
            {isVideoUrl(mainImage) ? (
              <video
                src={mainImage}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  position: 'static',
                  transform: 'none',
                }}
              />
            ) : (
              <img
                src={mainImage}
                alt={creator.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  position: 'static',
                  transform: 'none',
                }}
              />
            )}
          </div>

          <div className="detail-content">
            <p className="artist-no">CREATOR</p>
            <h1>{creator.name}</h1>

            <h2 className="text-[#3b82f6] font-bold text-lg mb-4">{categoryWithSkills}</h2>

            <p className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-6">
              {creator.bio || 'プロフィールはまだ登録されていません。'}
            </p>
            <Link className="btn btn-blue" href="/#contact">
              お問い合わせはこちら <span>→</span>
            </Link>
          </div>
        </section>

        <section className="container detail-works">
          <h2>WORKS</h2>
          {works.length > 0 ? (
            <div className="work-grid three">
              {works.map((work: any, index: number) => {
                const workImg = work.imageUrl || mainImage;
                const isVideo = isVideoUrl(workImg);
                const isHighlighted = work.id === targetWorkId;

                return (
                  <button
                    key={work.id || index}
                    id={`detail-work-${work.id}`}
                    type="button"
                    className={`work-card text-left cursor-pointer border-none bg-transparent p-2 transition-all duration-300 rounded-xl ${
                      isHighlighted ? 'ring-4 ring-amber-400 scale-105 shadow-xl' : ''
                    }`}
                    onClick={() => {
                      let subImgs: string[] = [];
                      let cleanDesc = work.description || '';

                      if (Array.isArray(work.subImages) && work.subImages.length > 0) {
                        subImgs = work.subImages;
                      } else {
                        const parsed = parseWorkDescription(cleanDesc);
                        cleanDesc = parsed.description;
                        subImgs = parsed.subImages;
                      }

                      setSelectedWork({
                        no: String(index + 1).padStart(2, '0'),
                        title: work.title,
                        category: work.category || 'WORK',
                        imageUrl: workImg,
                        subImages: subImgs,
                        description: cleanDesc || '詳細説明なし',
                      });
                      setModalDisplayImage(workImg);
                      setIsModalOpen(true);
                    }}
                  >
                    <div
                      className="w-full h-60 rounded-md p-3 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: '#C5C5C5' }}
                    >
                      {isVideo ? (
                        <video
                          src={workImg}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto',
                          }}
                        />
                      ) : (
                        <img
                          src={workImg}
                          alt={work.title}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto',
                          }}
                        />
                      )}
                    </div>
                    <h3 className="mt-3 text-base font-bold text-gray-800">{work.title}</h3>
                    <p className="text-xs text-gray-500 font-medium">{work.category || 'WORK'}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-8">登録されている作品がありません。</p>
          )}
        </section>
      </main>

      {/* モーダル */}
      {isModalOpen && selectedWork && (
        <div className="modal is-open" id="workModal">
          <div className="modal-bg" onClick={() => setIsModalOpen(false)}></div>
          <div className="modal-panel" role="dialog" aria-modal="true">
            <button
              type="button"
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <p className="modal-no">No.{selectedWork.no}</p>
            <h2>{selectedWork.title}</h2>

            {/* メイン拡大表示枠 */}
            <div className="my-4 w-full h-[380px] md:h-[420px] overflow-hidden flex items-center justify-center rounded-lg bg-gray-100 p-4">
              {isVideoUrl(modalDisplayImage || selectedWork.imageUrl) ? (
                <video
                  src={modalDisplayImage || selectedWork.imageUrl}
                  controls
                  autoPlay
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <img
                  src={modalDisplayImage || selectedWork.imageUrl}
                  alt={selectedWork.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>

            {/* ★ サブ画像サムネイル一覧 ★ */}
            {(() => {
              const rawImages = [selectedWork.imageUrl, ...(selectedWork.subImages || [])].filter(Boolean);
              const allImages = Array.from(new Set(rawImages));

              if (allImages.length <= 1) return null;

              return (
                <div className="my-3">
                  <p className="text-[11px] text-gray-400 font-bold mb-1.5 text-center">
                    画像をクリックすると上の枠で拡大表示されます
                  </p>
                  <div className="flex items-center justify-center gap-2.5 overflow-x-auto pb-1 px-1">
                    {allImages.map((imgUrl: string, idx: number) => {
                      const isSelected = (modalDisplayImage || selectedWork.imageUrl) === imgUrl;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModalDisplayImage(imgUrl)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all p-0.5 bg-gray-50 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 scale-105 shadow-md ring-2 ring-blue-200'
                              : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-400'
                          }`}
                        >
                          {isVideoUrl(imgUrl) ? (
                            <video src={imgUrl} className="w-full h-full object-contain" />
                          ) : (
                            <img src={imgUrl} alt={`サムネイル ${idx + 1}`} className="w-full h-full object-contain" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-3">{selectedWork.description}</p>
          </div>
        </div>
      )}

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