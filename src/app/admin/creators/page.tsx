'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

type CreatorItem = {
  id: string;
  name: string;
  category: string;
  skills: string;
  status: string;
  date: string;
  photoUrl: string;
  profile: string;
  selectedWorkIds: string[];
};

type WorkItem = {
  id: string;
  title: string;
  category: string;
  photoUrl: string;
};

type PhotoLibraryItem = {
  id: string;
  name: string;
  url: string;
};

const categories = ['動画', 'DTP', 'イラスト', 'WEB', 'Other'];
const ITEMS_PER_PAGE = 5;

const isVideoUrl = (url: string) => {
  return typeof url === 'string' && /\.(mp4|webm|mov|m4v)$/i.test(url);
};

function CreatorsContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');
  const targetRole = searchParams.get('role');

  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [availableWorks, setAvailableWorks] = useState<WorkItem[]>([]);
  const [photoLibrary, setPhotoLibrary] = useState<PhotoLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('動画');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<CreatorItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('動画');
  const [formSkills, setFormSkills] = useState('');
  const [formStatus, setFormStatus] = useState('公開済み');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | null>(null);
  const [formProfile, setFormProfile] = useState('');
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([]);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const fetchCreatorsAndPhotos = async (forceRefresh = false) => {
    try {
      const fetchOption: RequestInit = forceRefresh
        ? { cache: 'reload' }
        : { next: { revalidate: 60 } };

      const [resCreators, resWorks, resPhotos] = await Promise.all([
        fetch('/api/creators', fetchOption),
        fetch('/api/works', fetchOption),
        fetch('/api/photos', fetchOption),
      ]);

      if (resCreators.ok) {
        const dataCreators = await resCreators.json();
        const formattedCreators: CreatorItem[] = dataCreators.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.role || '動画',
          skills: item.skills || '',
          status: item.status || '公開済み',
          photoUrl: item.avatarUrl || '/icons/creatorhukusuu.png',
          profile: item.bio || '',
          date: new Date(item.createdAt)
            .toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
            .replace(/\//g, ' '),
          selectedWorkIds: Array.isArray(item.works)
            ? item.works.map((w: any) => (typeof w === 'string' ? w : w.id))
            : [],
        }));
        setCreators(formattedCreators);

        if (targetRole && categories.includes(targetRole)) {
          setSelectedCategory(targetRole);
        }
        if (targetId) {
          const targetCreator = formattedCreators.find((c) => c.id === targetId);
          if (targetCreator) {
            handleOpenEditModal(targetCreator);
          }
        }
      }

      if (resWorks.ok) {
        const dataWorks = await resWorks.json();
        const formattedWorks: WorkItem[] = dataWorks.map((w: any) => ({
          id: w.id,
          title: w.title,
          category: w.category || '動画',
          photoUrl: w.imageUrl || '/icons/works.png',
        }));
        setAvailableWorks(formattedWorks);
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
    fetchCreatorsAndPhotos();
    return () => {
      isMounted = false;
    };
  }, [targetId, targetRole]);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingCreator(null);
    setFormName('');
    setFormCategory(selectedCategory);
    setFormSkills('');
    setFormStatus('公開済み');
    setFormPhotoUrl(null);
    setFormProfile('');
    setSelectedWorkIds([]);
    setIsPreviewMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (creator: CreatorItem) => {
    setEditingCreator(creator);
    setFormName(creator.name);
    setFormCategory(creator.category);
    setFormSkills(creator.skills || '');
    setFormStatus(creator.status);
    setFormPhotoUrl(creator.photoUrl);
    setFormProfile(creator.profile || '');
    setSelectedWorkIds(creator.selectedWorkIds || []);
    setIsPreviewMode(false);
    setIsModalOpen(true);
  };

  const handleToggleWork = (workId: string) => {
    if (selectedWorkIds.includes(workId)) {
      setSelectedWorkIds(selectedWorkIds.filter((id) => id !== workId));
    } else {
      setSelectedWorkIds([...selectedWorkIds, workId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      alert('クリエイター名を入力してください。');
      return;
    }

    try {
      const isEditing = !!editingCreator;
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...(isEditing && { id: editingCreator.id }),
        name: formName,
        role: formCategory,
        skills: formSkills,
        bio: formProfile,
        avatarUrl: formPhotoUrl || '/icons/creatorhukusuu.png',
        works: selectedWorkIds,
      };

      const res = await fetch('/api/creators', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('保存に失敗しました');

      setIsModalOpen(false);
      await fetchCreatorsAndPhotos(true);
      alert(isEditing ? 'クリエイター情報を更新しました！' : 'クリエイターを追加しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('クリエイターの保存に失敗しました。');
    }
  };

  const handleDelete = async () => {
    if (!editingCreator) return;
    if (confirm(`クリエイター「${editingCreator.name}」を削除してもよろしいですか？`)) {
      try {
        const res = await fetch(`/api/creators?id=${editingCreator.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('削除に失敗しました');

        setIsModalOpen(false);
        await fetchCreatorsAndPhotos(true);
        alert('クリエイターを削除しました。');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('クリエイターの削除に失敗しました。');
      }
    }
  };

  const filteredCreators = creators.filter((c) => c.category === selectedCategory);
  const totalPages = Math.ceil(filteredCreators.length / ITEMS_PER_PAGE) || 1;
  const paginatedCreators = filteredCreators.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPreviewUrl = () => {
    if (!editingCreator) return '/artists';
    return `/harenowa?id=${editingCreator.id}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">クリエイター管理</h1>
          <Image src="/icons/creatorhukusuu.png" alt="クリエイターアイコン" width={48} height={48} />
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#EFDCC9] hover:bg-[#e4ceb9] text-gray-800 font-semibold rounded-xl shadow-sm transition"
        >
          <span className="text-xl font-bold">＋</span> 新規クリエイターの追加
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
          <div className="col-span-8 md:col-span-9 pl-24">名前 / プロフィール</div>
          <div className="col-span-4 md:col-span-3 text-right pr-6">投稿日</div>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">読み込み中...</div>
          ) : paginatedCreators.length > 0 ? (
            paginatedCreators.map((creator) => (
              <div
                key={creator.id}
                onClick={() => handleOpenEditModal(creator)}
                className={`grid grid-cols-12 items-center p-4 hover:bg-gray-50 transition cursor-pointer ${
                  targetId === creator.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                }`}
              >
                <div className="col-span-8 md:col-span-9 flex items-center gap-6">
                  <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {isVideoUrl(creator.photoUrl) ? (
                      <video src={creator.photoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={creator.photoUrl} alt={creator.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="space-y-1 pr-4">
                    <span className="font-medium text-gray-800 block text-lg">{creator.name}</span>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {creator.profile || 'プロフィール未設定'}
                    </p>
                  </div>
                </div>
                <div className="col-span-4 md:col-span-3 text-right pr-6 space-y-1">
                  <div className="text-gray-600 font-mono text-sm">{creator.date}</div>
                  <div className={`text-xs font-semibold ${creator.status === '公開済み' ? 'text-green-600' : 'text-gray-400'}`}>
                    {creator.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400">
              「{selectedCategory}」のクリエイターは登録されていません。
            </div>
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
              <h2 className="text-xl font-bold text-gray-800">
                {editingCreator ? 'クリエイター情報の編集' : '新規クリエイター追加'}
              </h2>

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
                    isPreviewMode ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  👁️ プレビュー確認
                </button>
              </div>
            </div>

            {!isPreviewMode ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">クリエイター名</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="名前を入力"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm"
                    >
                      <option value="公開済み">公開済み</option>
                      <option value="非公開">非公開</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    使用可能ソフト・ツール（例: Adobe Illustrator, Adobe Photoshop）
                  </label>
                  <input
                    type="text"
                    value={formSkills}
                    onChange={(e) => setFormSkills(e.target.value)}
                    placeholder="(Adobe Illustrator、Adobe Photoshop) などの形式で入力"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    プロフィール（紹介文・経歴）
                  </label>
                  <textarea
                    value={formProfile}
                    onChange={(e) => setFormProfile(e.target.value)}
                    placeholder="自己紹介や実績を入力してください。"
                    rows={4}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    1. ページ上部のメイン画像（「写真」から選択）
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {formPhotoUrl ? (
                        isVideoUrl(formPhotoUrl) ? (
                          <video src={formPhotoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : (
                          <img src={formPhotoUrl} alt="メイン写真" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <span className="text-xs text-gray-400 text-center">未選択</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMediaModalOpen(true)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm font-medium transition"
                    >
                      📷 「写真」から選択
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    2. 担当作品（「投稿/作品」から複数選択）
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
                    {availableWorks.length > 0 ? (
                      availableWorks.map((work) => {
                        const isChecked = selectedWorkIds.includes(work.id);
                        return (
                          <label
                            key={work.id}
                            onClick={() => handleToggleWork(work.id)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition ${
                              isChecked ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-purple-600 rounded"
                            />
                            <div className="w-8 h-8 rounded overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                              {isVideoUrl(work.photoUrl) ? (
                                <video src={work.photoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                              ) : (
                                <img src={work.photoUrl} alt={work.title} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-800 truncate">{work.title}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-gray-400">
                        「投稿/作品」画面に登録されている作品がありません。
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  {editingCreator ? (
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
                    <button type="submit" className="px-6 py-2 bg-[#EFDCC9] hover:bg-[#e4ceb9] text-gray-800 font-semibold rounded-lg shadow-sm transition text-sm">{editingCreator ? '更新する' : '追加する'}</button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4 bg-[#FBF9F5] p-6 rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
                  <span className="text-xs text-amber-700 font-bold">
                    👁️ クリエイター詳細ページ（全体）を表示中
                  </span>
                  <a
                    href={getPreviewUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:text-amber-800 underline font-semibold flex items-center gap-1"
                  >
                    別タブで開く ↗
                  </a>
                </div>

                <div className="w-full h-[500px] border border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner">
                  <iframe
                    src={getPreviewUrl()}
                    className="w-full h-full border-none"
                    title="クリエイター詳細プレビュー"
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
            <h3 className="text-lg font-bold text-gray-800 border-b pb-3">「写真」からメイン画像を選択</h3>
            
            {photoLibrary.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                {photoLibrary.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => {
                      setFormPhotoUrl(photo.url);
                      setIsMediaModalOpen(false);
                    }}
                    className={`border-2 rounded-xl p-2 cursor-pointer transition flex flex-col items-center hover:scale-105 ${
                      formPhotoUrl === photo.url ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
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

export default function CreatorsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-gray-400">
          クリエイター管理画面を読み込み中...
        </div>
      }
    >
      <CreatorsContent />
    </Suspense>
  );
}