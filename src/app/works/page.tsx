'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type Creator = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type WorkItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
  subImages?: string[];
  createdAt: string;
  creatorId?: string;
  creator?: Creator;
};

type PhotoItem = {
  id: string;
  name: string;
  url: string;
};

const categories = ['動画', 'DTP', 'イラスト', 'WEB', 'Other'];

// 説明文とサブ画像データの分離ヘパー関数
const parseWorkDescription = (rawDescription: string) => {
  if (!rawDescription) return { description: '', subImages: [] };

  const splitMarker = '\n\n__SUB_IMAGES__:';
  if (rawDescription.includes(splitMarker)) {
    const [desc, jsonStr] = rawDescription.split(splitMarker);
    try {
      const parsedImages = JSON.parse(jsonStr);
      return {
        description: desc || '',
        subImages: Array.isArray(parsedImages) ? parsedImages : [],
      };
    } catch (e) {
      return { description: rawDescription, subImages: [] };
    }
  }

  return { description: rawDescription, subImages: [] };
};

export default function AdminWorksPage() {
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [photoLibrary, setPhotoLibrary] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // モーダル・フォーム制御
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // 編集中の作品フォームステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('動画');
  const [description, setDescription] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [imageUrl, setImageUrl] = useState('/icons/works.png');
  const [subImages, setSubImages] = useState<string[]>([]);

  // 写真選択モーダルステート
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState<'main' | 'sub'>('main');

  // 🔄 データ一括取得
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resWorks, resCreators, resPhotos] = await Promise.all([
        fetch('/api/works', { cache: 'no-store' }),
        fetch('/api/creators', { cache: 'no-store' }),
        fetch('/api/photos', { cache: 'no-store' }),
      ]);

      if (resWorks.ok) {
        const dataWorks = await resWorks.json();
        setWorks(dataWorks);
      }
      if (resCreators.ok) {
        const dataCreators = await resCreators.json();
        setCreators(dataCreators);
      }
      if (resPhotos.ok) {
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
      console.error('データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 新規追加モーダルを開く
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setTitle('');
    setCategory('動画');
    setDescription('');
    setCreatorId(creators.length > 0 ? creators[0].id : '');
    setImageUrl('/icons/works.png');
    setSubImages([]);
    setActiveTab('edit');
    setIsEditModalOpen(true);
  };

  // 編集モーダルを開く
  const handleOpenEditModal = (work: WorkItem) => {
    setModalMode('edit');
    setEditingId(work.id);
    setTitle(work.title || '');
    setCategory(work.category || '動画');
    setCreatorId(work.creatorId || (work.creator ? (work.creator as any).id : ''));
    setImageUrl(work.imageUrl || '/icons/works.png');

    const { description: parsedDesc, subImages: parsedSubImages } = parseWorkDescription(
      work.description || ''
    );
    setDescription(parsedDesc);
    setSubImages(parsedSubImages);

    setActiveTab('edit');
    setIsEditModalOpen(true);
  };

  // 写真選択モーダルを開く
  const handleOpenMediaModal = (target: 'main' | 'sub') => {
    setSelectingTarget(target);
    setIsMediaModalOpen(true);
  };

  // 写真の選択適用
  const handleSelectPhoto = (url: string) => {
    if (selectingTarget === 'main') {
      setImageUrl(url);
    } else {
      setSubImages((prev) => [...prev, url]);
    }
    setIsMediaModalOpen(false);
  };

  // サブ画像の削除
  const handleDeleteSubImage = (indexToDelete: number) => {
    setSubImages(subImages.filter((_, idx) => idx !== indexToDelete));
  };

  // 作品の保存（作成 / 更新）
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('作品タイトルを入力してください。');
      return;
    }

    try {
      const payload = {
        id: editingId,
        title,
        category,
        description,
        imageUrl,
        creatorId: creatorId || undefined,
        subImages,
      };

      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const res = await fetch('/api/works', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      alert(modalMode === 'create' ? '作品を追加しました！' : '作品情報を更新しました！');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。');
    }
  };

  // 作品の削除
  const handleDeleteWork = async () => {
    if (!editingId) return;
    if (!confirm('この作品を本当に削除しますか？')) return;

    try {
      const res = await fetch(`/api/works?id=${editingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');

      alert('作品を削除しました。');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました。');
    }
  };

  const selectedCreator = creators.find((c) => c.id === creatorId);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ページタイトル ＆ 新規追加ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">投稿/作品管理</h1>
          <Image src="/icons/works.png" alt="作品アイコン" width={36} height={36} />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-6 py-2.5 bg-[#DDE7F3] hover:bg-[#c9d9ec] text-gray-800 font-bold rounded-xl shadow-xs transition"
        >
          ＋ 新しい作品を投稿する
        </button>
      </div>

      {/* 作品一覧テーブル */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 font-medium">作品一覧を読み込んでいます...</div>
        ) : works.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {works.map((work) => {
              const { description: parsedDesc, subImages: parsedSub } = parseWorkDescription(
                work.description || ''
              );
              const creatorName = work.creator?.name || '未設定';

              return (
                <div
                  key={work.id}
                  onClick={() => handleOpenEditModal(work)}
                  className="p-4 hover:bg-gray-50/80 transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    {/* サムネイル */}
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border flex-shrink-0 flex items-center justify-center p-1">
                      <img
                        src={work.imageUrl || '/icons/works.png'}
                        alt={work.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-md border border-blue-100">
                          {work.category || '動画'}
                        </span>
                        <h3 className="font-bold text-gray-800 text-base group-hover:text-blue-600 transition">
                          {work.title}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 max-w-lg">
                        {parsedDesc || '説明文なし'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 pt-0.5">
                        <span>👤 制作者: {creatorName}</span>
                        {parsedSub.length > 0 && (
                          <span className="text-purple-600 font-bold">
                            🖼️ サブ画像: {parsedSub.length}枚
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-gray-400 group-hover:text-gray-600 font-bold text-sm">
                    編集 ✏️
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center text-gray-400">登録されている作品はありません。</div>
        )}
      </div>

      {/* 作品編集・新規追加モーダル */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
            {/* モーダルヘッダー ＆ タブ切替 */}
            <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">
                {modalMode === 'create' ? '新規作品の投稿' : '作品の編集'}
              </h2>

              <div className="flex items-center gap-2">
                <div className="flex bg-gray-200/80 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'edit' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500'
                    }`}
                  >
                    ✏️ 編集画面
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeTab === 'preview' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500'
                    }`}
                  >
                    👁️ プレビュー確認
                  </button>
                </div>

                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* モーダルボディ */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {activeTab === 'edit' ? (
                <form id="workForm" onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">作品タイトル</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full p-3 border border-gray-300 rounded-xl text-sm font-bold"
                      placeholder="例: アニメーション動画制作"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">カテゴリ</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium bg-white"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">担当クリエイター</label>
                      <select
                        value={creatorId}
                        onChange={(e) => setCreatorId(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl text-sm font-medium bg-white"
                      >
                        <option value="">未選択</option>
                        {creators.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">作品の詳細説明</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-xl text-sm leading-relaxed"
                      placeholder="制作背景やこだわったポイントを入力してください"
                    />
                  </div>

                  {/* ★ メイン画像設定 */}
                  <div className="space-y-2 pt-2 border-t">
                    <label className="block text-xs font-bold text-gray-700">
                      メイン画像（一覧・サムネイル用）
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-20 bg-gray-50 rounded-xl overflow-hidden border flex items-center justify-center p-2">
                        <img
                          src={imageUrl || '/icons/works.png'}
                          alt="メイン画像"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenMediaModal('main')}
                        className="px-4 py-2.5 bg-[#DAE6DC] hover:bg-[#c8d8ca] text-gray-800 font-semibold rounded-xl text-xs shadow-xs transition"
                      >
                        📷 「写真」から選択
                      </button>
                    </div>
                  </div>

                  {/* ★★★ サブ画像（複数管理）設定 ★★★ */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700">
                        サブ画像・詳細用画像（複数選択可）
                      </label>
                      <span className="text-xs text-gray-400">詳細ページだけに表示されます</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {subImages.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative h-20 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden group flex items-center justify-center p-1"
                        >
                          <img
                            src={url}
                            alt={`サブ画像 ${idx + 1}`}
                            className="max-w-full max-h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteSubImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md z-10"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleOpenMediaModal('sub')}
                        className="h-20 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:text-purple-600 transition bg-gray-50/50"
                      >
                        <span className="text-2xl font-bold">+</span>
                        <span className="text-[10px] font-bold">画像を追加</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* 👁️ プレビュー確認タブ */
                <div className="space-y-6 bg-gray-50 p-6 rounded-2xl border">
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-md">
                      {category}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-900">{title || 'タイトル未入力'}</h3>
                    {selectedCreator && (
                      <p className="text-xs text-gray-500 font-medium">
                        制作者: {selectedCreator.name}
                      </p>
                    )}
                  </div>

                  {/* メイン画像プレビュー */}
                  <div className="w-full h-64 bg-white rounded-xl border flex items-center justify-center p-4 overflow-hidden">
                    <img
                      src={imageUrl || '/icons/works.png'}
                      alt="メインプレビュー"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* サブ画像ギャラリープレビュー */}
                  {subImages.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <span className="text-xs font-bold text-gray-500">【サブ画像一覧】</span>
                      <div className="grid grid-cols-3 gap-3">
                        {subImages.map((url, idx) => (
                          <div
                            key={idx}
                            className="h-28 bg-white border rounded-xl flex items-center justify-center p-2 overflow-hidden"
                          >
                            <img
                              src={url}
                              alt={`サブ ${idx}`}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border-t pt-4">
                    {description || '詳細説明はまだありません。'}
                  </p>
                </div>
              )}
            </div>

            {/* モーダルフッター */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              {modalMode === 'edit' ? (
                <button
                  type="button"
                  onClick={handleDeleteWork}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition border border-red-200"
                >
                  🗑️ 作品を削除する
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl text-sm transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  form="workForm"
                  className="px-6 py-2.5 bg-[#DDE7F3] hover:bg-[#c9d9ec] text-gray-800 font-bold rounded-xl text-sm shadow-xs transition"
                >
                  {modalMode === 'create' ? '作品を投稿する' : '設定を更新する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <h3 className="text-lg font-bold text-gray-800 border-b pb-3">
              「写真」から{selectingTarget === 'main' ? 'メイン' : 'サブ'}画像を選択
            </h3>

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