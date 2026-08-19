'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type PhotoItem = {
  id: string;
  name: string;
  url: string;
};

export default function HeaderFooterSettingsPage() {
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('footer');
  const [isSaving, setIsSaving] = useState(false);

  // ヘッダー用ステート
  const [headerLogoType, setHeaderLogoType] = useState<'text' | 'image'>('text');
  const [headerLogoText, setHeaderLogoText] = useState('BeSmile');
  const [headerLogoUrl, setHeaderLogoUrl] = useState('/icons/top.png');

  // フッター用ステート
  const [footerLogoType, setFooterLogoType] = useState<'text' | 'image'>('text');
  const [footerLogoText, setFooterLogoText] = useState('BeSmile');
  const [footerLogoUrl, setFooterLogoUrl] = useState('/icons/top.png');
  const [footerComment, setFooterComment] = useState('');

  // ★ SNS URL用ステート
  const [instagramUrl, setInstagramUrl] = useState('https://www.instagram.com/besmile_higashimikuni/?hl=ja');
  const [twitterUrl, setTwitterUrl] = useState('https://x.com/bsma13a');

  // 写真ライブラリ & モーダル
  const [photoLibrary, setPhotoLibrary] = useState<PhotoItem[]>([]);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState<'header' | 'footer'>('header');

  // 🔄 データ取得
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [resSettings, resPhotos] = await Promise.all([
          fetch('/api/settings/header-footer', { next: { revalidate: 60 } }),
          fetch('/api/photos', { next: { revalidate: 60 } }),
        ]);

        if (resSettings.ok && isMounted) {
          const data = await resSettings.json();
          setHeaderLogoType(data.headerLogoType || 'text');
          setHeaderLogoText(data.headerLogoText || 'BeSmile');
          setHeaderLogoUrl(data.headerLogoUrl || '/icons/top.png');

          setFooterLogoType(data.footerLogoType || 'text');
          setFooterLogoText(data.footerLogoText || 'BeSmile');
          setFooterLogoUrl(data.footerLogoUrl || '/icons/top.png');
          setFooterComment(data.footerComment || '');

          if (data.instagramUrl) setInstagramUrl(data.instagramUrl);
          if (data.twitterUrl) setTwitterUrl(data.twitterUrl);
        }

        if (resPhotos.ok && isMounted) {
          const dataPhotos = await resPhotos.json();
          setPhotoLibrary(
            dataPhotos.map((item: any) => ({
              id: item.id,
              name: item.name,
              url: item.url,
            }))
          );
        }
      } catch (error) {
        console.error('設定データ取得エラー:', error);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 💾 保存処理
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/settings/header-footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headerLogoType,
          headerLogoText,
          headerLogoUrl,
          footerLogoType,
          footerLogoText,
          footerLogoUrl,
          footerComment,
          instagramUrl,
          twitterUrl,
        }),
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      alert('ヘッダー・フッターの設定を正常に保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenMediaModal = (target: 'header' | 'footer') => {
    setSelectingTarget(target);
    setIsMediaModalOpen(true);
  };

  const handleSelectPhoto = (url: string) => {
    if (selectingTarget === 'header') {
      setHeaderLogoUrl(url);
    } else {
      setFooterLogoUrl(url);
    }
    setIsMediaModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ページタイトル ＆ タブ切替 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">フッター/ヘッダー</h1>
          <Image src="/icons/header.png" alt="ヘッダー/フッターアイコン" width={36} height={36} />
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 bg-[#EFDCC9] hover:bg-[#e4ceb9] text-gray-800 font-semibold rounded-xl text-sm shadow-xs transition"
        >
          {activeTab === 'header' ? 'ヘッダーを別タブで開く ↗' : 'フッターを別タブで開く ↗'}
        </a>
      </div>

      {/* タブ切り替えボタン */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`px-8 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'footer'
              ? 'bg-[#EFDCC9] text-gray-800 shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          フッター
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('header')}
          className={`px-8 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'header'
              ? 'bg-[#EFDCC9] text-gray-800 shadow-xs'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          ヘッダー
        </button>
      </div>

      {/* 設定フォーム */}
      <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-xs border border-gray-100 space-y-8">
        {/* ================= ヘッダー設定 ================= */}
        {activeTab === 'header' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">ヘッダーロゴの設定</h2>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                <input
                  type="radio"
                  name="headerLogoType"
                  value="text"
                  checked={headerLogoType === 'text'}
                  onChange={() => setHeaderLogoType('text')}
                  className="w-4 h-4 text-blue-600"
                />
                テキスト（文字表示）
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                <input
                  type="radio"
                  name="headerLogoType"
                  value="image"
                  checked={headerLogoType === 'image'}
                  onChange={() => setHeaderLogoType('image')}
                  className="w-4 h-4 text-blue-600"
                />
                画像ロゴを表示
              </label>
            </div>

            {headerLogoType === 'text' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500">ロゴテキスト</label>
                <input
                  type="text"
                  value={headerLogoText}
                  onChange={(e) => setHeaderLogoText(e.target.value)}
                  className="w-full max-w-md p-3 border border-gray-300 rounded-xl text-base font-bold"
                  placeholder="例: BeSmile"
                />
              </div>
            )}

            {headerLogoType === 'image' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500">選択中のロゴ画像</label>
                <div className="w-48 h-20 bg-gray-50 border border-gray-300 rounded-xl flex items-center justify-center p-2 overflow-hidden">
                  <img src={headerLogoUrl} alt="ヘッダーロゴ" className="max-w-full max-h-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenMediaModal('header')}
                  className="px-4 py-2 bg-[#DAE6DC] hover:bg-[#c8d8ca] text-gray-800 font-semibold rounded-lg text-sm shadow-xs transition"
                >
                  📷 「写真」からロゴを選択
                </button>
              </div>
            )}

            <div className="pt-6 border-t space-y-3">
              <span className="text-xs font-bold text-gray-400 block">【ヘッダー表示プレビュー】</span>
              <div className="p-4 bg-[#FAF8F5] border border-gray-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {headerLogoType === 'image' ? (
                    <img src={headerLogoUrl} alt="ロゴ" className="h-8 object-contain" />
                  ) : (
                    <span className="font-extrabold text-xl text-gray-900">{headerLogoText || 'BeSmile'}</span>
                  )}
                  <span className="text-xs text-gray-500 font-medium ml-1">Creative Support Team</span>
                </div>
                <div className="flex gap-4 text-xs font-bold text-gray-600">
                  <span>CREATOR</span>
                  <span>CONTACT</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= フッター設定 ================= */}
        {activeTab === 'footer' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">フッターロゴ ＆ コメント設定</h2>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                <input
                  type="radio"
                  name="footerLogoType"
                  value="text"
                  checked={footerLogoType === 'text'}
                  onChange={() => setFooterLogoType('text')}
                  className="w-4 h-4 text-blue-600"
                />
                テキスト（文字表示）
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                <input
                  type="radio"
                  name="footerLogoType"
                  value="image"
                  checked={footerLogoType === 'image'}
                  onChange={() => setFooterLogoType('image')}
                  className="w-4 h-4 text-blue-600"
                />
                画像ロゴを表示
              </label>
            </div>

            {footerLogoType === 'text' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500">フッターロゴテキスト</label>
                <input
                  type="text"
                  value={footerLogoText}
                  onChange={(e) => setFooterLogoText(e.target.value)}
                  className="w-full max-w-md p-3 border border-gray-300 rounded-xl text-base font-bold"
                  placeholder="例: BeSmile"
                />
              </div>
            )}

            {footerLogoType === 'image' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500">選択中のロゴ画像</label>
                <div className="w-48 h-20 bg-gray-50 border border-gray-300 rounded-xl flex items-center justify-center p-2 overflow-hidden">
                  <img src={footerLogoUrl} alt="フッターロゴ" className="max-w-full max-h-full object-contain" />
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenMediaModal('footer')}
                  className="px-4 py-2 bg-[#DAE6DC] hover:bg-[#c8d8ca] text-gray-800 font-semibold rounded-lg text-sm shadow-xs transition"
                >
                  📷 「写真」からロゴを選択
                </button>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-gray-500">フッターコメント（説明文）</label>
              <textarea
                value={footerComment}
                onChange={(e) => setFooterComment(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm"
                placeholder="フッターに表示する説明文を入力"
              />
            </div>

            {/* SNS URL 設定エリア */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-bold text-gray-800">SNS アカウント URL 設定</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500">Instagram URL</label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="https://www.instagram.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500">X (旧Twitter) URL</label>
                  <input
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm font-mono"
                    placeholder="https://x.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t space-y-3">
              <span className="text-xs font-bold text-gray-400 block">【フッター表示プレビュー】</span>
              <div className="p-6 bg-[#2B2D30] text-white rounded-xl space-y-3">
                {footerLogoType === 'image' ? (
                  <img src={footerLogoUrl} alt="フッターロゴ" className="h-8 object-contain" />
                ) : (
                  <span className="font-bold text-2xl block">{footerLogoText || 'BeSmile'}</span>
                )}
                <p className="text-xs text-gray-300 whitespace-pre-wrap max-w-lg">
                  {footerComment || '説明文が入ります。'}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-700">
                  <span>📸 Insta: {instagramUrl}</span>
                  <span>🐦 X: {twitterUrl}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-[#DDE7F3] hover:bg-[#c9d9ec] text-gray-800 font-bold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '設定を保存する'}
          </button>
        </div>
      </form>

      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsMediaModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 font-bold text-xl"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-3">「写真」からロゴ画像を選択</h3>
            {photoLibrary.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                {photoLibrary.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => handleSelectPhoto(photo.url)}
                    className="border-2 border-gray-200 hover:border-blue-400 rounded-xl p-2 cursor-pointer transition flex flex-col items-center hover:scale-105"
                  >
                    <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs text-gray-600 truncate w-full text-center mt-1">
                      {photo.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">登録されている画像がありません。</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}