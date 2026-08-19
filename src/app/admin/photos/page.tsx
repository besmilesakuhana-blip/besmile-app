'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

type PhotoItem = {
  id: string;
  name: string;
  type: string;
  date: string;
  url: string;
  size: string;
};

const ITEMS_PER_PAGE = 5;

export default function PhotosPage() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPhotoFiles, setNewPhotoFile] = useState<File[]>([]);
  const [isUploading, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const fetchPhotos = async (forceRefresh = false) => {
    try {
      const fetchOption: RequestInit = forceRefresh
        ? { cache: 'reload' }
        : { next: { revalidate: 60 } };

      const res = await fetch('/api/photos', fetchOption);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      const formattedPhotos: PhotoItem[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        type:
          item.type ||
          item.category ||
          (item.url?.startsWith('data:video') || item.url?.endsWith('.mp4')
            ? 'video'
            : item.url?.startsWith('data:audio') || item.url?.endsWith('.mp3')
            ? 'audio'
            : 'image'),
        url: item.url,
        size: item.size || '1.0 MB',
        date: new Date(item.createdAt || Date.now())
          .toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
          .replace(/\//g, ' '),
      }));

      setPhotos(formattedPhotos);

      if (targetId) {
        const targetIndex = formattedPhotos.findIndex((p) => p.id === targetId);
        if (targetIndex !== -1) {
          const calculatedPage = Math.floor(targetIndex / ITEMS_PER_PAGE) + 1;
          setCurrentPage(calculatedPage);
          setSelectedPhoto(formattedPhotos[targetIndex]);
        }
      }
    } catch (error) {
      console.error('写真素材の取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchPhotos();
    return () => {
      isMounted = false;
    };
  }, [targetId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewPhotoFile(Array.from(e.target.files));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAddPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhotoFiles.length === 0) {
      alert('ファイルを選択してください。');
      return;
    }

    setIsSaving(true);
    setUploadProgress({ current: 0, total: newPhotoFiles.length });

    try {
      for (let i = 0; i < newPhotoFiles.length; i++) {
        const file = newPhotoFiles[i];
        setUploadProgress({ current: i + 1, total: newPhotoFiles.length });

        let mediaType = 'image';
        if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';

        const base64Url = await fileToBase64(file);
        const fileName = file.name.replace(/\.[^/.]+$/, '');
        const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

        await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fileName,
            url: base64Url,
            category: mediaType,
            size: fileSizeStr,
          }),
        });
      }

      setIsAddModalOpen(false);
      setNewPhotoFile([]);
      await fetchPhotos(true);
      alert(`${newPhotoFiles.length}件の素材を追加しました！`);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('素材の追加に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;
    if (confirm(`素材「${selectedPhoto.name}」をライブラリから削除してもよろしいですか？`)) {
      try {
        await fetch(`/api/photos?id=${selectedPhoto.id}`, {
          method: 'DELETE',
        });

        setSelectedPhoto(null);
        await fetchPhotos(true);
        alert('素材を削除しました。');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('素材の削除に失敗しました。');
      }
    }
  };

  const totalPages = Math.ceil(photos.length / ITEMS_PER_PAGE) || 1;
  const paginatedPhotos = photos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">写真・メディア素材</h1>
          <Image src="/icons/photos.png" alt="写真アイコン" width={48} height={48} />
        </div>

        <button
          onClick={() => {
            setNewPhotoFile([]);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#DAE6DC] hover:bg-[#c8d8ca] text-gray-800 font-semibold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5"
        >
          <span className="text-xl font-bold">＋</span> 新規素材の追加
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 bg-[#DDE7F3] py-3 px-6 text-gray-700 font-medium">
          <div className="col-span-8 md:col-span-9 pl-24">ファイル名 / 種別</div>
          <div className="col-span-4 md:col-span-3 text-right pr-6">投稿日</div>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">読み込み中...</div>
          ) : paginatedPhotos.length > 0 ? (
            paginatedPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className={`grid grid-cols-12 items-center p-4 hover:bg-gray-50 transition cursor-pointer ${
                  targetId === photo.id ? 'bg-[#DAE6DC]/40 border-l-4 border-[#8fae94]' : ''
                }`}
              >
                <div className="col-span-8 md:col-span-9 flex items-center gap-6">
                  <div className="w-20 h-20 bg-gray-100 border border-gray-300 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {photo.type === 'image' && (
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                    )}
                    {photo.type === 'video' && (
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <span className="text-2xl">🎬</span>
                        <span className="text-[10px] font-bold mt-1">動画</span>
                      </div>
                    )}
                    {photo.type === 'audio' && (
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <span className="text-2xl">🎵</span>
                        <span className="text-[10px] font-bold mt-1">音楽</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-medium text-gray-800 block text-base truncate max-w-xs md:max-w-md">
                      {photo.name}
                    </span>
                    <span className="text-xs text-gray-400 uppercase font-semibold">
                      {photo.type === 'image' ? '画像' : photo.type === 'video' ? '動画' : '音楽'}
                    </span>
                  </div>
                </div>

                <div className="col-span-4 md:col-span-3 text-right pr-6 text-gray-600 font-mono text-sm">
                  {photo.date}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400">写真・メディア素材は登録されていません。</div>
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

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-5 relative">
            <button
              onClick={() => !isUploading && setIsAddModalOpen(false)}
              disabled={isUploading}
              className="absolute top-4 right-4 text-gray-400 font-bold text-xl hover:text-gray-600 disabled:opacity-30"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-gray-800">新規素材の追加（複数選択可）</h2>

            <form onSubmit={handleAddPhotos} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ファイル選択（複数選択OK）
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#DAE6DC] file:text-gray-800 cursor-pointer disabled:opacity-50"
                />
              </div>

              {newPhotoFiles.length > 0 && (
                <div className="p-3 bg-gray-50 border rounded-xl max-h-36 overflow-y-auto space-y-1">
                  <div className="text-xs font-bold text-gray-600 border-b pb-1 mb-1">
                    選択中のファイル ({newPhotoFiles.length}件):
                  </div>
                  {newPhotoFiles.map((f, idx) => (
                    <div key={idx} className="text-xs text-gray-700 truncate flex justify-between">
                      <span>• {f.name}</span>
                      <span className="text-gray-400 ml-2">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  ))}
                </div>
              )}

              {isUploading && (
                <div className="space-y-2 text-center py-2">
                  <div className="text-sm font-bold text-gray-700">
                    アップロード中... ({uploadProgress.current} / {uploadProgress.total})
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8fae94] h-full transition-all duration-200"
                      style={{
                        width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isUploading || newPhotoFiles.length === 0}
                  className="px-5 py-2 bg-[#DAE6DC] hover:bg-[#c8d8ca] text-gray-800 font-semibold rounded-lg shadow-sm transition text-sm disabled:opacity-50"
                >
                  {isUploading ? '保存中...' : `${newPhotoFiles.length > 0 ? `${newPhotoFiles.length}件を追加` : '追加する'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 relative">
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 text-gray-400 font-bold text-xl">✕</button>
            <h2 className="text-xl font-bold text-gray-800">素材の詳細・プレビュー</h2>

            <div className="w-full h-52 bg-gray-100 border rounded-xl flex items-center justify-center overflow-hidden">
              {selectedPhoto.type === 'image' && (
                <img src={selectedPhoto.url} alt={selectedPhoto.name} className="w-full h-full object-contain" />
              )}
              {selectedPhoto.type === 'video' && (
                <video src={selectedPhoto.url} controls className="w-full h-full object-contain bg-black" />
              )}
              {selectedPhoto.type === 'audio' && (
                <div className="w-full px-6 flex flex-col items-center gap-3">
                  <span className="text-4xl">🎵</span>
                  <audio src={selectedPhoto.url} controls className="w-full" />
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 border-t pt-3">
              <div><strong className="text-gray-800">ファイル名:</strong> {selectedPhoto.name}</div>
              <div><strong className="text-gray-800">投稿日:</strong> {selectedPhoto.date}</div>
              <div><strong className="text-gray-800">ファイルサイズ:</strong> {selectedPhoto.size}</div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-sm transition border border-red-200"
              >
                🗑 削除する
              </button>
              <button onClick={() => setSelectedPhoto(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}