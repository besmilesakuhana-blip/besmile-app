'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type PhotoLibraryItem = {
  id: string;
  name: string;
  url: string;
};

export default function SettingsPage() {
  const router = useRouter();

  // 設定項目の状態管理
  const [siteTitle, setSiteTitle] = useState('BE SMILE');
  const [adminEmail, setAdminEmail] = useState('admin@example.com');
  const [faviconUrl, setFaviconUrl] = useState<string>('/icons/top.png');

  // メール送信用設定（SMTP）ステート
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  // 写真ライブラリの動的状態管理
  const [photoLibrary, setPhotoLibrary] = useState<PhotoLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // メディアライブラリ選択モーダル
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // 🔄 データベースから基本設定 & 写真ライブラリを取得
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [resSettings, resPhotos] = await Promise.all([
          fetch('/api/settings', { next: { revalidate: 60 } }),
          fetch('/api/photos', { next: { revalidate: 60 } }),
        ]);

        if (resSettings.ok && isMounted) {
          const dataSettings = await resSettings.json();
          if (dataSettings) {
            const email = dataSettings.contactEmail || 'admin@example.com';
            setSiteTitle(dataSettings.siteTitle || 'BE SMILE');
            setAdminEmail(email);
            setFaviconUrl(dataSettings.mainImageUrl || '/icons/top.png');
            setSmtpUser(dataSettings.smtpUser || email);
            if (dataSettings.smtpPass) setSmtpPass(dataSettings.smtpPass);
          }
        }

        if (resPhotos.ok && isMounted) {
          const dataPhotos = await resPhotos.json();
          const formattedPhotos: PhotoLibraryItem[] = dataPhotos.map((item: any) => ({
            id: item.id,
            name: item.name,
            url: item.url,
          }));
          setPhotoLibrary(formattedPhotos);
        }
      } catch (error) {
        console.error('設定データの取得エラー:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 編集中の画面でファビコンとタイトルをリアルタイム反映する処理
  useEffect(() => {
    if (faviconUrl) {
      let link: HTMLLinkElement | null =
        document.querySelector("link[rel='icon']") ||
        document.querySelector("link[rel='shortcut icon']");

      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }

    if (siteTitle) {
      document.title = siteTitle;
    }
  }, [faviconUrl, siteTitle]);

  // ★ 管理者メールアドレスの変更時に送信用メールアドレスも自動連動させるハンドラー
  const handleAdminEmailChange = (val: string) => {
    setAdminEmail(val);
    setSmtpUser(val);
  };

  // ローカルファイルアップロード処理 (Base64化)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFaviconUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // データベース ＆ 設定への保存処理
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteTitle,
          contactEmail: adminEmail,
          mainImageUrl: faviconUrl,
          smtpUser: adminEmail,
          smtpPass,
        }),
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      let link: HTMLLinkElement | null =
        document.querySelector("link[rel='icon']") ||
        document.querySelector("link[rel='shortcut icon']");
      if (link) {
        link.href = faviconUrl;
      }

      alert('基本設定および送信用メール設定（SMTP）を統一して保存しました！');

      router.refresh();
    } catch (error) {
      console.error('設定保存エラー:', error);
      alert('設定の保存に失敗しました。');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* 1. ページタイトル */}
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-800">基本設定</h1>
        <Image src="/icons/settings.png" alt="歯車アイコン" width={48} height={48} />
      </div>

      {/* 2. 設定フォーム */}
      <form onSubmit={handleSave} className="space-y-8 pt-4">
        {/* サイトのタイトル */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
          <label className="md:col-span-4 text-gray-700 font-medium text-lg">
            サイトのタイトル
          </label>
          <div className="md:col-span-8">
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="w-full max-w-md p-3 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
              placeholder="サイト名を入力"
            />
          </div>
        </div>

        {/* サイトのアイコン */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-4">
          <label className="md:col-span-4 text-gray-700 font-medium text-lg pt-3">
            サイトのアイコン<br />
            <span className="text-xs text-gray-400 font-normal">（ファビコン設定）</span>
          </label>

          <div className="md:col-span-8 space-y-3">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="w-16 h-16 rounded-full border border-gray-300 bg-white flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0 p-2">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="ファビコン" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-8 h-8 rounded-full border border-gray-300 bg-gray-100" />
                )}
              </div>

              <div className="border border-gray-300 rounded-xl p-2.5 bg-gray-100 flex items-center gap-3 shadow-sm min-w-[220px]">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                </div>

                <div className="border border-gray-300 rounded-t-lg px-3 py-1 flex items-center gap-2 bg-white shadow-xs">
                  <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {faviconUrl ? (
                      <img src={faviconUrl} alt="タブアイコン" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-400 bg-gray-200" />
                    )}
                  </div>

                  <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
                    {siteTitle || 'サイト名'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(true)}
                className="px-4 py-2 bg-[#DAE6DC] hover:bg-[#c8d8ca] text-gray-800 rounded-lg text-sm font-semibold shadow-sm transition"
              >
                📷 「写真」から選択
              </button>

              <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition">
                ファイル選択
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 管理者 兼 送信用メールアドレス */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
          <label className="md:col-span-4 text-gray-700 font-medium text-lg">
            管理者＆送信用メールアドレス<br />
            <span className="text-xs text-gray-400 font-normal">（お問い合わせ返信用 Gmail）</span>
          </label>
          <div className="md:col-span-8">
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => handleAdminEmailChange(e.target.value)}
              className="w-full max-w-md p-3 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm font-mono text-sm"
              placeholder="yozakura810114514@gmail.com"
            />
          </div>
        </div>

        {/* メール送信（SMTP）認証設定 */}
        <div className="border-t border-gray-200 pt-6 space-y-6">
          <h2 className="text-xl font-bold text-gray-800">お問い合わせ メール送信認証設定</h2>

          {/* Google アプリパスワード */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
            <label className="md:col-span-4 text-gray-700 font-medium text-lg">
              Google アプリパスワード<br />
              <span className="text-xs text-gray-400 font-normal">（16桁の生成コード）</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                className="w-full max-w-md p-3 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm font-mono text-sm"
                placeholder="••••••••••••"
              />
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="pt-6 flex justify-end max-w-md md:max-w-none border-t border-gray-200">
          <button
            type="submit"
            className="px-8 py-3 bg-[#DDE7F3] hover:bg-[#c9d9ec] text-gray-800 font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            設定を保存
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

            <h3 className="text-lg font-bold text-gray-800 border-b pb-3">「写真」からファビコン画像を選択</h3>

            {photoLibrary.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                {photoLibrary.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => {
                      setFaviconUrl(photo.url);
                      setIsMediaModalOpen(false);
                    }}
                    className={`border-2 rounded-xl p-2 cursor-pointer transition flex flex-col items-center hover:scale-105 ${
                      faviconUrl === photo.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs text-gray-600 truncate w-full text-center mt-1">{photo.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                ライブラリに登録された画像がありません。「写真・メディア素材」画面から先に追加してください。
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}