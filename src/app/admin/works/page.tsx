'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

type WorkItem = {
  id: string;
  title: string;
  category: string;
  status: string;
  photoUrl: string;
  description: string;
  subImages?: string[];
  date: string;
};

type PhotoLibraryItem = {
  id: string;
  name: string;
  url: string;
};

const categories = ['動画', 'DTP', 'イラスト', 'WEB', 'Other'];
const ITEMS_PER_PAGE = 5;

const SUB_IMAGE_MARKER = '___SUB_IMAGES_JSON___:';
const OLD_SUB_IMAGE_MARKER = '__SUB_IMAGES__:';

const parseWorkDescription = (raw: string) => {
  if (!raw) return { description: '', subImages: [] };

  const markers = [SUB_IMAGE_MARKER, OLD_SUB_IMAGE_MARKER];
  let description = raw;
  let subImages: string[] = [];

  for (const marker of markers) {
    const pos = description.indexOf(marker);
    if (pos !== -1) {
      const jsonPart = description.substring(pos + marker.length).trim();
      description = description.substring(0, pos).trim();
      try {
        const parsed = JSON.parse(jsonPart);
        if (Array.isArray(parsed)) {
          subImages = parsed;
        }
      } catch (e) {}
      break;
    }
  }

  return { description: description.trim(), subImages };
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string' || !url) return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.startsWith('data:video') ||
    /\.(mp4|webm|mov|m4v|ogv)$/.test(cleanUrl)
  );
};

function WorksContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');
  const targetCategory = searchParams.get('category');

  const [works, setWorks] = useState<WorkItem[]>([]);
  const [photoLibrary, setPhotoLibrary] = useState<PhotoLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('動画');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('動画');
  const [formStatus, setFormStatus] = useState('公開済み');
  const [formDescription, setFormDescription] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [subImages, setSubImages] = useState<string[]>([]);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState<'main' | 'sub'>('main');

  const fetchWorksAndPhotos = async (forceRefresh = false) => {
    try {
      const fetchOption: RequestInit = forceRefresh
        ? { cache: 'reload' }
        : { next: { revalidate: 60 } };

      const [resWorks, resPhotos] = await Promise.all([
        fetch('/api/works', fetchOption),
        fetch('/api/photos', fetchOption),
      ]);

      if (resWorks.ok) {
        const dataWorks = await resWorks.json();
        const formattedWorks: WorkItem[] = dataWorks.map((item: any) => {
          let subImgs: string[] = [];
          let cleanDesc = item.description || '';

          if (Array.isArray(item.subImages) && item.subImages.length > 0) {
            subImgs = item.subImages;
            cleanDesc = parseWorkDescription(cleanDesc).description;
          } else {
            const parsed = parseWorkDescription(cleanDesc);
            cleanDesc = parsed.description;
            subImgs = parsed.subImages;
          }

          return {
            id: item.id,
            title: item.title,
            category: item.category || '動画',
            status: item.status || '公開済み',
            photoUrl: item.imageUrl || '/icons/works.png',
            description: cleanDesc,
            subImages: subImgs,
            date: new Date(item.createdAt)
              .toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
              .replace(/\//g, ' '),
          };
        });
        setWorks(formattedWorks);

        if (targetCategory && categories.includes(targetCategory)) {
          setSelectedCategory(targetCategory);
        }
        if (targetId) {
          const targetWork = formattedWorks.find((w) => w.id === targetId);
          if (targetWork) {
            handleOpenEditModal(targetWork);
          }
        }
      }

      if (resPhotos.ok) {
        const dataPhotos = await resPhotos.json();
        const formattedPhotos: PhotoLibraryItem[] = dataPhotos.map((item: any) => ({
          id: item.id,
          name: item.name,
          url: item.url,
        }));
        setPhotoLibrary(formattedPhotos);
      }
    } catch (error) {
      console.error('データの取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchWorksAndPhotos();
    return () => {
      isMounted = false;
    };
  }, [targetId, targetCategory]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingWork(null);
    setFormTitle('');
    setFormCategory(selectedCategory);
    setFormStatus('公開済み');
    setFormDescription('');
    setSelectedPhotoUrl(null);
    setSubImages([]);
    setIsPreviewMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (work: WorkItem) => {
    setEditingWork(work);
    setFormTitle(work.title);
    setFormCategory(work.category);
    setFormStatus(work.status);

    const { description: cleanDesc, subImages: parsedSub } = parseWorkDescription(
      work.description || ''
    );
    setFormDescription(cleanDesc);

    setSelectedPhotoUrl(work.photoUrl);
    setSubImages(
      work.subImages && work.subImages.length > 0 ? work.subImages : parsedSub
    );
    setIsPreviewMode(false);
    setIsModalOpen(true);
  };

  const handleOpenMediaModal = (target: 'main' | 'sub') => {
    setSelectingTarget(target);
    setIsMediaModalOpen(true);
  };

  const handleSelectPhoto = (photoUrl: string) => {
    if (selectingTarget === 'main') {
      setSelectedPhotoUrl(photoUrl);
    } else {
      setSubImages((prev) => [...prev, photoUrl]);
    }
    setIsMediaModalOpen(false);
  };

  const handleDeleteSubImage = (indexToDelete: number) => {
    setSubImages(subImages.filter((_, idx) => idx !== indexToDelete));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) {
      alert('作品タイトルを入力してください。');
      return;
    }

    try {
      const isEditing = !!editingWork;
      const method = isEditing ? 'PUT' : 'POST';

      const { description: cleanDesc } = parseWorkDescription(formDescription);

      const payload = {
        ...(isEditing && { id: editingWork.id }),
        title: formTitle,
        category: formCategory,
        description: cleanDesc,
        imageUrl: selectedPhotoUrl || '/icons/works.png',
        subImages: subImages,
      };

      const res = await fetch('/api/works', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      setIsModalOpen(false);
      await fetchWorksAndPhotos(true);
      alert(isEditing ? '作品情報を更新しました！' : '作品を追加しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('作品の保存に失敗しました。');
    }
  };

  const handleDelete = async () => {
    if (!editingWork) return;
    if (confirm(`作品「${editingWork.title}」を削除してもよろしいですか？`)) {
      try {
        const res = await fetch(`/api/works?id=${editingWork.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('削除に失敗しました');

        setIsModalOpen(false);
        await fetchWorksAndPhotos(true);
        alert('作品を削除しました。');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('作品の削除に失敗しました。');
      }
    }
  };

  const filteredWorks = works.filter((w) => w.category === selectedCategory);
  const totalPages = Math.ceil(filteredWorks.length / ITEMS_PER_PAGE) || 1;
  const paginatedWorks = filteredWorks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">投稿/作品</h1>
          <Image src="/icons/works.png" alt="投稿/作品アイコン" width={48} height={48} />
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ECE0EE] hover:bg-[#dfd0e2] text-gray-800 font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5"
        >
          <span className="text-xl font-bold">＋</span> 新規作品の追加
        </button>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleSelectCategory(cat)}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 border shadow-sm ${
              selectedCategory === cat
                ? 'bg-[#DDE7F3] border-blue-200 text-gray-800 font-bold scale-105'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 bg-[#DDE7F3] py-3 px-6 text-gray-700 font-medium">
          <div className="col-span-8 md:col-span-9 pl-24">作品名 / 詳細説明</div>
          <div className="col-span-4 md:col-span-3 text-right pr-6">投稿日</div>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">読み込み中...</div>
          ) : paginatedWorks.length > 0 ? (
            paginatedWorks.map((work) => (
              <div
                key={work.id}
                onClick={() => handleOpenEditModal(work)}
                className={`grid grid-cols-12 items-center p-4 hover:bg-gray-50 transition cursor-pointer ${
                  targetId === work.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                }`}
              >
                <div className="col-span-8 md:col-span-9 flex items-center gap-6">
                  <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {isVideoUrl(work.photoUrl) ? (
                      <video
                        src={work.photoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img src={work.photoUrl} alt={work.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="space-y-1 pr-4">
                    <span className="font-medium text-gray-800 block text-lg">{work.title}</span>
                    <p className="text-xs text-gray-500 line-clamp-1">{work.description || '詳細説明なし'}</p>
                    {work.subImages && work.subImages.length > 0 && (
                      <span className="inline-block text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        🖼️ サブ画像: {work.subImages.length}枚
                      </span>
                    )}
                  </div>
                </div>

                <div className="col-span-4 md:col-span-3 text-right pr-6 space-y-1">
                  <div className="text-gray-600 font-mono text-sm">{work.date}</div>
                  <div className={`text-xs font-semibold ${work.status === '公開済み' ? 'text-green-600' : 'text-gray-400'}`}>
                    {work.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400">「{selectedCategory}」の作品は登録されていません。</div>
          )}
        </div>

        <div className="flex justify-end items-center gap-2 p-6 bg-white border-t">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-2 text-gray-400 hover:text-gray-600 disabled:opacity-30">&lt;</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${currentPage === page ? 'bg-gray-600 text-white font-bold' : 'border border-gray-300 hover:bg-gray-100 text-gray-700'}`}>
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-2 text-gray-400 hover:text-gray-600 disabled:opacity-30">&gt;</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl space-y-5 relative my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>

            <div className="flex items-center justify-between border-b pb-3 pr-8">
              <h2 className="text-xl font-bold text-gray-800">{editingWork ? '作品の編集' : '新規作品の追加'}</h2>

              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    !isPreviewMode ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ✏️ 編集画面
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(true)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                    isPreviewMode ? 'bg-purple-100 text-purple-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  👁️ プレビュー確認
                </button>
              </div>
            </div>

            {!isPreviewMode ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作品タイトル</label>
                  <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="タイトルを入力" className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm">
                      {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                    <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm">
                      <option value="公開済み">公開済み</option>
                      <option value="非公開">非公開</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作品の詳細説明</label>
                  <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="作品の概要やコンセプトを入力してください。" rows={4} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>

                {/* メイン画像 */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-bold text-gray-800 mb-2">メイン画像（「写真」から選択）</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {selectedPhotoUrl ? (
                        isVideoUrl(selectedPhotoUrl) ? (
                          <video src={selectedPhotoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={selectedPhotoUrl} alt="選択画像" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <span className="text-xs text-gray-400 text-center">未選択</span>
                      )}
                    </div>
                    <button type="button" onClick={() => handleOpenMediaModal('main')} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm font-medium transition">📷 「写真」から選択</button>
                  </div>
                </div>

                {/* 詳細用サブ画像 */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-800">
                      詳細用サブ画像（複数追加可能）
                    </label>
                    <span className="text-xs text-gray-400">作品詳細モーダルのみに表示されます</span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-1">
                    {subImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden group"
                      >
                        {isVideoUrl(url) ? (
                          <video src={url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={url} alt={`サブ画像 ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
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
                      className="w-20 h-20 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition bg-gray-50 text-xs font-medium"
                    >
                      <span className="text-xl font-bold">+</span>
                      <span>画像追加</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  {editingWork ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-sm transition border border-red-200"
                    >
                      🗑 削除する
                    </button>
                  ) : (
                    <div />
                  )}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm">キャンセル</button>
                    <button type="submit" className="px-6 py-2 bg-[#ECE0EE] hover:bg-[#dfd0e2] text-gray-800 font-semibold rounded-lg shadow-sm transition text-sm">{editingWork ? '更新する' : '追加する'}</button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4 bg-[#FBF9F5] p-6 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center bg-purple-50 border border-purple-200 px-4 py-2 rounded-lg">
                  <span className="text-xs text-purple-700 font-bold">
                    👁️ 選択中の作品をピンポイント表示中
                  </span>
                  <a
                    href={editingWork ? `/artists?highlightWorkId=${editingWork.id}` : '/artists'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:text-purple-800 underline font-semibold flex items-center gap-1"
                  >
                    別タブで開く ↗
                  </a>
                </div>

                <div className="w-full h-[500px] border border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner">
                  <iframe
                    src={editingWork ? `/artists?highlightWorkId=${editingWork.id}` : '/artists'}
                    className="w-full h-full border-none"
                    title="作品プレビュー"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(false)}
                    className="px-5 py-2 bg-gray-700 text-white font-medium rounded-xl text-xs hover:bg-gray-800 transition"
                  >
                    ✏️ 編集に戻る
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isMediaModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative">
            <button onClick={() => setIsMediaModalOpen(false)} className="absolute top-4 right-4 text-gray-400 font-bold text-xl">✕</button>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-3">
              「写真」から{selectingTarget === 'main' ? 'メイン' : 'サブ'}画像を選択
            </h3>
            
            {photoLibrary.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                {photoLibrary.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => handleSelectPhoto(photo.url)}
                    className={`border-2 rounded-xl p-2 cursor-pointer transition flex flex-col items-center hover:scale-105 ${
                      (selectingTarget === 'main' && selectedPhotoUrl === photo.url) ||
                      (selectingTarget === 'sub' && subImages.includes(photo.url))
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                      {isVideoUrl(photo.url) ? (
                        <video src={photo.url} autoPlay loop muted playsInline className="w-full h-full object-contain" />
                      ) : (
                        <img src={photo.url} alt={photo.name} className="w-full h-full object-contain" />
                      )}
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
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorksPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-gray-400">
          作品管理画面を読み込み中...
        </div>
      }
    >
      <WorksContent />
    </Suspense>
  );
}