'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type PhotoItem = {
  id: string;
  name: string;
  url: string;
};

type CategoryCounts = {
  web: number;
  movie: number;
  dtp: number;
  illust: number;
  other: number;
  dateNote: string;
};

export default function TopSettingsPage() {
  const [mainTitle, setMainTitle] = useState('クリエイターとして働く。\n企業の力になる。');
  const [description, setDescription] = useState(
    'BeSmileは、WEB制作・動画・DTP・イラスト・Other（3D、ゲーム、音源など）を行うクリエイター特化型の就労継続支援A型事業所です。'
  );

  const [counts, setCounts] = useState<CategoryCounts>({
    web: 5,
    movie: 5,
    dtp: 3,
    illust: 10,
    other: 5,
    dateNote: '※2026年7月付',
  });

  const [topImages, setTopImages] = useState<string[]>([
    '/icons/photos.png',
    '/icons/works.png',
    '/icons/creators.png',
    '/icons/top.png',
  ]);

  const [photoLibrary, setPhotoLibrary] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [resSettings, resPhotos] = await Promise.all([
          fetch('/api/top-settings', { cache: 'no-store' }),
          fetch('/api/photos', { cache: 'no-store' }),
        ]);

        if (resSettings.ok && isMounted) {
          const dataSettings = await resSettings.json();
          if (dataSettings) {
            if (dataSettings.heroTitle) setMainTitle(dataSettings.heroTitle);
            if (dataSettings.aboutDescription) setDescription(dataSettings.aboutDescription);

            if (dataSettings.mainImageUrl) {
              try {
                const parsedImages = JSON.parse(dataSettings.mainImageUrl);
                if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                  setTopImages(parsedImages);
                }
              } catch {
                setTopImages([dataSettings.mainImageUrl]);
              }
            }

            if (dataSettings.heroSubtitle) {
              try {
                const parsedCounts = JSON.parse(dataSettings.heroSubtitle);
                setCounts((prev) => ({ ...prev, ...parsedCounts }));
              } catch (e) {
                // スルー
              }
            }
          }
        }

        if (resPhotos.ok && isMounted) {
          const dataPhotos = await resPhotos.json();
          const formattedPhotos: PhotoItem[] = dataPhotos.map((item: any) => ({
            id: item.id,
            name: item.name,
            url: item.url,
          }));
          setPhotoLibrary(formattedPhotos);
        }
      } catch (error) {
        console.error('トップ設定の取得エラー:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAutoCalculateCounts = async () => {
    try {
      const res = await fetch('/api/creators', { cache: 'no-store' });
      if (!res.ok) return;
      const creators = await res.json();

      let web = 0, movie = 0, dtp = 0, illust = 0, other = 0;

      creators.forEach((c: any) => {
        const role = c.role || '';
        if (role.includes('WEB')) web++;
        else if (role.includes('動画')) movie++;
        else if (role.includes('DTP')) dtp++;
        else if (role.includes('イラスト')) illust++;
        else other++;
      });

      const today = new Date();
      const dateNote = `※${today.getFullYear()}年${today.getMonth() + 1}月付`;

      setCounts({ web, movie, dtp, illust, other, dateNote });
      alert('登録中のクリエイターデータから現在人数を自動入力しました！');
    } catch (e) {
      console.error('自動計算エラー:', e);
    }
  };

  const handleOpenMediaModal = (index?: number) => {
    setReplacingIndex(index !== undefined ? index : null);
    setIsMediaModalOpen(true);
  };

  const handleSelectPhoto = (url: string) => {
    if (replacingIndex !== null) {
      const updated = [...topImages];
      updated[replacingIndex] = url;
      setTopImages(updated);
    } else {
      setTopImages([...topImages, url]);
    }
    setIsMediaModalOpen(false);
  };

  const handleDeleteImage = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTopImages(topImages.filter((_, idx) => idx !== indexToDelete));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/top-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroTitle: mainTitle,
          heroSubtitle: JSON.stringify(counts),
          aboutTitle: '',
          aboutDescription: description,
          mainImageUrl: JSON.stringify(topImages),
        }),
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      alert('トップ・サイト設定を保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。');
    }
  };

  const totalCreators = counts.web + counts.movie + counts.dtp + counts.illust + counts.other;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">トップ・サイト設定</h1>
          <Image src="/icons/top.png" alt="トップ設定アイコン" width={48} height={48} />
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl shadow-sm transition"
        >
          本番サイトを表示 ↗
        </a>
      </div>

      <form onSubmit={handleSave} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {/* メインテキスト */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DDE7F3]"></span>
            メインテキスト設定
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
            <label className="md:col-span-4 text-gray-700 font-medium text-sm pt-2">
              メインタイトル（日本語）
            </label>
            <textarea
              value={mainTitle}
              onChange={(e) => setMainTitle(e.target.value)}
              rows={2}
              className="md:col-span-8 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 font-bold leading-relaxed"
              placeholder="例: クリエイターとして働く。&#10;企業の力になる。"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
            <label className="md:col-span-4 text-gray-700 font-medium text-sm pt-2">サイト説明文（概要）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="md:col-span-8 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* クリエイター数カウント設定 */}
        <div className="space-y-5 border-t pt-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              トップページの「クリエイター数」設定
            </h2>
            <button
              type="button"
              onClick={handleAutoCalculateCounts}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition"
            >
              🔄 登録中クリエイターから自動算出
            </button>
          </div>

          <p className="text-xs text-gray-500">
            合計人数: <strong className="text-gray-800 text-sm">{totalCreators}名</strong> （自動計算されます）
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">WEB制作</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={counts.web}
                  onChange={(e) => setCounts({ ...counts, web: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold"
                />
                <span className="text-xs text-gray-500">名</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">動画制作</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={counts.movie}
                  onChange={(e) => setCounts({ ...counts, movie: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold"
                />
                <span className="text-xs text-gray-500">名</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">DTP制作</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={counts.dtp}
                  onChange={(e) => setCounts({ ...counts, dtp: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold"
                />
                <span className="text-xs text-gray-500">名</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">イラスト制作</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={counts.illust}
                  onChange={(e) => setCounts({ ...counts, illust: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold"
                />
                <span className="text-xs text-gray-500">名</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Other</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={counts.other}
                  onChange={(e) => setCounts({ ...counts, other: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold"
                />
                <span className="text-xs text-gray-500">名</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">日付注釈テキスト</label>
            <input
              type="text"
              value={counts.dateNote}
              onChange={(e) => setCounts({ ...counts, dateNote: e.target.value })}
              className="w-full md:w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder="例: ※2026年7月付"
            />
          </div>
        </div>

        {/* メインビジュアル画像設定 */}
        <div className="space-y-4 border-t pt-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EFDCC9]"></span>
              トップメインビジュアル画像
            </h2>
            <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
              トップページのモザイク枠に左から順に<strong>最大5枚</strong>表示されます。<br />
              推奨比率: <strong>横長（16:9 または 4:3）〜正方形（1:1）</strong>（※枠に合わせて中央トリミングされます）
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            {topImages.map((url, idx) => (
              <div
                key={idx}
                onClick={() => handleOpenMediaModal(idx)}
                className="group relative h-28 bg-gray-50 border-2 border-gray-200 hover:border-blue-400 rounded-xl overflow-hidden cursor-pointer transition flex items-center justify-center p-1.5"
              >
                <img src={url} alt={`トップ画像 ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={(e) => handleDeleteImage(idx, e)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-md z-10"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleOpenMediaModal()}
            className="px-5 py-2.5 bg-[#DAE6DC] hover:bg-[#c8d8ca] text-gray-800 font-semibold rounded-xl text-sm shadow-sm transition"
          >
            ＋ 「写真」から画像を追加する
          </button>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            className="px-8 py-3 bg-[#DDE7F3] hover:bg-[#c9d9ec] text-gray-800 font-bold rounded-xl shadow-sm transition"
          >
            トップ・サイト設定を保存
          </button>
        </div>
      </form>

      {/* 写真ライブラリ選択モーダル */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsMediaModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 font-bold text-xl"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-3">「写真」から画像を選択</h3>
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