'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [headerLogoType, setHeaderLogoType] = useState('text');
  const [headerLogoUrl, setHeaderLogoUrl] = useState('/icons/top.png');
  const [headerLogoText, setHeaderLogoText] = useState('BeSmile');

  useEffect(() => {
    let isMounted = true;

    const fetchHeaderSetting = async () => {
      try {
        const res = await fetch('/api/settings/header-footer', {
          next: { revalidate: 3600 }, // 1時間キャッシュ（無駄な毎回のDBクエリを防止）
        });
        if (res.ok && isMounted) {
          const s = await res.json();
          setHeaderLogoType(s.headerLogoType || 'text');
          setHeaderLogoUrl(s.headerLogoUrl || '/icons/top.png');
          setHeaderLogoText(s.headerLogoText || 'BeSmile');
        }
      } catch (e) {
        console.error('ヘッダー設定の取得エラー:', e);
      }
    };

    fetchHeaderSetting();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="site-header" id="header">
      <div className="header-inner">
        <Link className="brand flex items-center gap-2" href="/" aria-label="TOP">
          {headerLogoType === 'image' && headerLogoUrl ? (
            <img src={headerLogoUrl} alt="ロゴ" className="h-10 object-contain" />
          ) : (
            <span className="brand-main">{headerLogoText}</span>
          )}
          <span className="brand-sub">Creative Support Team</span>
        </Link>
        <nav className="global-nav" aria-label="グローバルナビ">
          <Link href="/artists">CREATOR</Link>
          <a href="/#contact">CONTACT</a>
        </nav>
      </div>
    </header>
  );
}