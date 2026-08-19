'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const menuItems = [
  { name: 'ダッシュボード', path: '/admin/dashboard', icon: '' },
  { name: '基本設定', path: '/admin/settings', icon: '/icons/settings.png' },
  { name: 'アカウント管理', path: '/admin/accounts', icon: '/icons/creators.png' },
  { name: '投稿/作品', path: '/admin/works', icon: '/icons/works.png' },
  { name: '写真', path: '/admin/photos', icon: '/icons/photos.png' },
  { name: 'クリエイター管理', path: '/admin/creators', icon: '/icons/creatorhukusuu.png' },
  { name: 'ヘッダー/フッター', path: '/admin/header-footer', icon: '/icons/header.png' },
  { name: 'トップ・サイト設定', path: '/admin/top-settings', icon: '/icons/top.png' },
  { name: 'お問い合わせ管理', path: '/admin/inquiries', icon: '/icons/inquiries.png' },
];

// ページ名・メニュー固定検索
const pageIndex = [
  { name: 'ダッシュボード', path: '/admin/dashboard', sub: '管理画面トップ' },
  { name: '基本設定', path: '/admin/settings', sub: 'サイト名・メール等' },
  { name: 'アカウント管理', path: '/admin/accounts', sub: '管理者設定' },
  { name: '投稿/作品', path: '/admin/works', sub: '作品一覧' },
  { name: '写真', path: '/admin/photos', sub: 'メディア・画像' },
  { name: 'クリエイター管理', path: '/admin/creators', sub: 'クリエイター一覧' },
  { name: 'ヘッダー/フッター', path: '/admin/header-footer', sub: '表示設定' },
  { name: 'トップ・サイト設定', path: '/admin/top-settings', sub: 'TOP設定' },
  { name: 'お問い合わせ管理', path: '/admin/inquiries', sub: '問い合わせ一覧' },
];

type SearchResult = {
  id?: string;
  title: string;
  sub: string;
  path: string;
  type?: string;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // キーワード入力時にDB横断検索APIを呼び出す（デバウンス処理付き）
  useEffect(() => {
    if (!query.trim()) {
      setDbResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setDbResults(data);
        }
      } catch (e) {
        console.error('検索エラー:', e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // メニュー・ページ名のヒット結果
  const pageResults: SearchResult[] = query.trim()
    ? pageIndex
        .filter((p) => p.name.includes(query) || p.sub.includes(query))
        .map((p) => ({ title: p.name, sub: `ページ / ${p.sub}`, path: p.path }))
    : [];

  // 合計検索結果
  const allResults = [...pageResults, ...dbResults];

  const handleSelect = (path: string) => {
    setQuery('');
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className="flex min-h-screen bg-[#F7F4EF]">
      <aside className="w-64 bg-white shadow-md relative">
        {/* 検索バーエリア */}
        <div className="p-4 relative">
          <div className="flex items-center bg-gray-50 border rounded-lg p-2">
            <Image src="/icons/search.png" alt="検索" width={20} height={20} className="mr-2" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="検索（作品名、メアド、名前等）..."
              className="w-full bg-transparent outline-none text-xs text-gray-700"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 font-bold ml-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* 検索結果ドロップダウン */}
          {isOpen && query.trim() && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div className="absolute left-4 right-4 top-16 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden p-1 space-y-1 max-h-80 overflow-y-auto">
                <div className="text-[10px] font-bold text-gray-400 px-2 py-1 border-b border-gray-100 flex justify-between">
                  <span>検索結果 ({allResults.length}件)</span>
                  {isSearching && <span className="animate-pulse text-blue-500">検索中...</span>}
                </div>

                {allResults.length > 0 ? (
                  allResults.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(item.path)}
                      className="w-full flex flex-col px-3 py-2 text-left rounded-lg hover:bg-blue-50 transition text-xs group"
                    >
                      <span className="font-bold text-gray-800 group-hover:text-blue-600 truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {item.sub}
                      </span>
                    </button>
                  ))
                ) : (
                  !isSearching && (
                    <div className="p-3 text-center text-xs text-gray-400">
                      該当するデータが見つかりません
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* サイドバーナビゲーション */}
        <nav className="mt-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center py-2 px-4 text-gray-700 hover:bg-gray-100 text-sm font-medium"
            >
              {item.icon ? (
                <Image src={item.icon} alt={item.name} width={20} height={20} className="mr-3" />
              ) : (
                <span className="w-5 mr-3 inline-block" />
              )}
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}