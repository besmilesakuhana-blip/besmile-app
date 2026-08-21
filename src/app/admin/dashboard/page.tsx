'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Announcement = {
  id: string;
  title: string;
  date: string;
  category: string;
  content: string;
};

const menuCards = [
  { name: '基本設定', path: '/admin/settings', icon: '/icons/settings.png', bg: 'bg-[#DDE7F3]' },
  { name: '投稿/作品', path: '/admin/works', icon: '/icons/works.png', bg: 'bg-[#ECE0EE]' },
  { name: 'クリエイター管理', path: '/admin/creators', icon: '/icons/creatorhukusuu.png', bg: 'bg-[#EFDCC9]' },
  { name: 'トップ・サイト設定', path: '/admin/top-settings', icon: '/icons/top.png', bg: 'bg-[#ECE0EE]' },
  { name: 'アカウント管理', path: '/admin/accounts', icon: '/icons/creators.png', bg: 'bg-[#EFDCC9]' },
  { name: '写真', path: '/admin/photos', icon: '/icons/photos.png', bg: 'bg-[#DAE6DC]' },
  { name: 'ヘッダー/フッター', path: '/admin/header-footer', icon: '/icons/header.png', bg: 'bg-gray-300' },
  { name: 'お問い合わせ管理', path: '/admin/inquiries', icon: '/icons/inquiries.png', bg: 'bg-[#DAE6DC]' },
];

export default function DashboardPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // リアルタイムアクセス解析ステート
  const [ageData, setAgeData] = useState([
    { name: '20代', value: 0, color: '#93C5FD' },
    { name: '30代', value: 0, color: '#C4B5FD' },
    { name: '40代', value: 0, color: '#A7F3D0' },
    { name: 'その他', value: 0, color: '#FDE68A' },
  ]);
  const [lineData, setLineData] = useState([
    { day: '月', pv: 0 },
    { day: '火', pv: 0 },
    { day: '水', pv: 0 },
    { day: '木', pv: 0 },
    { day: '金', pv: 0 },
    { day: '土', pv: 0 },
    { day: '日', pv: 0 },
  ]);
  const [totalPV, setTotalPV] = useState(0);

  const [hoveredAge, setHoveredAge] = useState<{ name: string; value: number } | null>(null);
  const [hoveredLine, setHoveredLine] = useState<{ day: string; pv: number } | null>(null);

  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);
  const [isAllNoticeModalOpen, setIsAllNoticeModalOpen] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('お知らせ');
  const [editContent, setEditContent] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('お知らせ');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      const fetchOption: RequestInit = forceRefresh
        ? { cache: 'reload' }
        : { cache: 'no-store' };

      const [resAnalytics, resAnnouncements] = await Promise.all([
        fetch('/api/analytics', fetchOption),
        fetch('/api/announcements', fetchOption),
      ]);

      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        if (data.lineData) setLineData(data.lineData);
        if (data.ageData) setAgeData(data.ageData);
        if (data.totalPV !== undefined) setTotalPV(data.totalPV);
      }

      if (resAnnouncements.ok) {
        const data = await resAnnouncements.json();
        const formattedData: Announcement[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          category: item.category || 'お知らせ',
          content: item.content,
          date: new Date(item.createdAt).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
        setAnnouncements(formattedData);
      }
    } catch (error) {
      console.error('ダッシュボードデータの取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ★ 最新3件のみを確実に抽出
  const latestThreeAnnouncements = useMemo(() => {
    return announcements.slice(0, 3);
  }, [announcements]);

  const handleOpenNoticeModal = (notice: Announcement) => {
    setSelectedNotice(notice);
    setEditTitle(notice.title);
    setEditCategory(notice.category);
    setEditContent(notice.content);
    setIsEditMode(false);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('タイトルと本文を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          content: newContent,
        }),
      });

      if (!res.ok) throw new Error('投稿に失敗しました');

      setNewTitle('');
      setNewContent('');
      setNewCategory('お知らせ');
      setIsCreateModalOpen(false);

      await fetchDashboardData(true);
      alert('お知らせを投稿しました！');
    } catch (error) {
      console.error('投稿エラー:', error);
      alert('お知らせの投稿に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotice) return;

    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedNotice.id,
          title: editTitle,
          category: editCategory,
          content: editContent,
        }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');

      setIsEditMode(false);
      setSelectedNotice(null);
      await fetchDashboardData(true);
      alert('お知らせを更新しました！');
    } catch (error) {
      console.error('更新エラー:', error);
      alert('お知らせの更新に失敗しました。');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('このお知らせを削除してもよろしいですか？')) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/announcements?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('削除に失敗しました');

      setSelectedNotice(null);
      await fetchDashboardData(true);
      alert('お知らせを削除しました。');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('お知らせの削除に失敗しました。');
    } finally {
      setIsDeleting(false);
    }
  };

  // 折れ線グラフ動的計算
  const maxPV = Math.max(...lineData.map((d) => d.pv), 10);
  const getSvgY = (pv: number) => 80 - (pv / maxPV) * 60;
  const points = lineData.map((d, i) => ({
    x: 10 + i * 40,
    y: getSvgY(d.pv),
    item: d,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  const topAge = [...ageData].sort((a, b) => b.value - a.value)[0] || { name: '20代', value: 0 };

  return (
    <div className="space-y-10 max-w-6xl">
      {/* 1. メニュー */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-800">メニュー</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuCards.map((card) => (
            <Link
              key={card.path}
              href={card.path}
              className={`${card.bg} rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer`}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <Image src={card.icon} alt={card.name} width={48} height={48} className="object-contain" />
              </div>
              <span className="font-bold text-gray-800 text-sm">{card.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. ダッシュボード */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">ダッシュボード</h1>
          <span className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            リアルタイム同期中 (総アクセス: {totalPV} PV)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* 年齢層分析 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-700 text-base">閲覧者の年齢層割合</h3>
              <span className="text-xs text-gray-400 font-mono">リアルタイム集計</span>
            </div>

            <div className="flex items-center justify-center gap-8 h-48 relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 transform">
                  {ageData.map((item, idx) => {
                    const prevSum = ageData.slice(0, idx).reduce((sum, current) => sum + current.value, 0);
                    return (
                      <circle
                        key={item.name}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="3.8"
                        strokeDasharray={`${item.value} ${100 - item.value}`}
                        strokeDashoffset={`-${prevSum}`}
                        className="hover:opacity-80 transition cursor-pointer"
                        onMouseEnter={() => setHoveredAge(item)}
                        onMouseLeave={() => setHoveredAge(null)}
                      />
                    );
                  })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-gray-400">{hoveredAge ? hoveredAge.name : '最多層'}</span>
                  <span className="text-lg font-bold text-gray-800">
                    {hoveredAge ? `${hoveredAge.value}%` : `${topAge.name} (${topAge.value}%)`}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {ageData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 font-medium">{item.name}:</span>
                    <span className="font-bold text-gray-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* アクセス数推移 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-700 text-base">週間アクセス数推移 (PV)</h3>
              <span className="text-xs text-gray-400 font-mono">今週のデータ</span>
            </div>

            <div className="h-48 relative flex flex-col justify-between pt-4">
              <div className="h-6 text-center">
                {hoveredLine ? (
                  <span className="text-xs font-bold bg-gray-800 text-white px-3 py-1 rounded-full">
                    {hoveredLine.day}曜日: {hoveredLine.pv} PV
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">グラフの点にカーソルを合わせると数値を確認できます</span>
                )}
              </div>

              <div className="relative w-full h-32 flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#F3F4F6" strokeWidth="1" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#F3F4F6" strokeWidth="1" />
                  <line x1="0" y1="80" x2="300" y2="80" stroke="#F3F4F6" strokeWidth="1" />

                  {points.length > 0 && (
                    <>
                      <path
                        d={`${pathD} L ${points[points.length - 1].x},100 L ${points[0].x},100 Z`}
                        fill="rgba(218, 230, 220, 0.4)"
                      />
                      <path d={pathD} fill="transparent" stroke="#82A385" strokeWidth="3" strokeLinecap="round" />
                    </>
                  )}

                  {points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="5"
                      fill="#82A385"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="hover:r-7 transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredLine(pt.item)}
                      onMouseLeave={() => setHoveredLine(null)}
                    />
                  ))}
                </svg>
              </div>

              <div className="flex justify-between text-xs text-gray-400 font-mono px-1 border-t pt-1">
                {lineData.map((d) => (
                  <span key={d.day}>{d.day}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. お知らせ（★ 常に最新3件のみ表示 ★） */}
      <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">お知らせ</h2>
            <button
              onClick={() => setIsAllNoticeModalOpen(true)}
              title="お知らせの全件一覧をみる"
              className="p-1.5 hover:bg-gray-100 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <Image src="/icons/notice.png" alt="お知らせベル" width={28} height={28} className="object-contain" />
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
          >
            <span>＋</span>
            <span>新規作成</span>
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-gray-400 py-4 text-center">読み込み中...</p>
          ) : latestThreeAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">現在お知らせはありません。</p>
          ) : (
            latestThreeAnnouncements.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenNoticeModal(item)}
                className="p-4 bg-gray-50/80 hover:bg-gray-100 rounded-xl cursor-pointer transition flex items-center justify-between text-gray-800 font-medium text-sm"
              >
                <span className="truncate pr-4">{item.title}</span>
                <span className="text-xs text-gray-400 font-mono flex-shrink-0">→ 詳細</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 新規作成モーダル */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-5 relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-3">新しいお知らせを投稿</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">カテゴリ</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="お知らせ">お知らせ</option>
                  <option value="重要">重要</option>
                  <option value="更新情報">更新情報</option>
                  <option value="メンテナンス">メンテナンス</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">タイトル</label>
                <input
                  type="text"
                  placeholder="例: 夏季休業のお知らせ"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">本文</label>
                <textarea
                  rows={4}
                  placeholder="お知らせの詳細テキストを入力してください"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? '投稿中...' : '投稿する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 詳細・編集モーダル */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 relative">
            <button
              onClick={() => {
                setSelectedNotice(null);
                setIsEditMode(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl"
            >
              ✕
            </button>

            {!isEditMode ? (
              <>
                <div className="border-b pb-3 pr-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-2.5 py-0.5 bg-[#DDE7F3] text-gray-700 text-xs font-semibold rounded-md">
                      {selectedNotice.category}
                    </span>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="text-xs text-blue-600 hover:underline font-bold"
                    >
                      ✏️ 編集する
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{selectedNotice.title}</h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">日時: {selectedNotice.date}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-gray-200">
                  {selectedNotice.content}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDeleteAnnouncement(selectedNotice.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-xl text-sm transition disabled:opacity-50 border border-red-200"
                  >
                    {isDeleting ? '削除中...' : '🗑 削除する'}
                  </button>

                  <button
                    onClick={() => setSelectedNotice(null)}
                    className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-300 transition"
                  >
                    閉じる
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleUpdateAnnouncement} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">お知らせの編集</h3>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">カテゴリ</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="お知らせ">お知らせ</option>
                    <option value="重要">重要</option>
                    <option value="更新情報">更新情報</option>
                    <option value="メンテナンス">メンテナンス</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">タイトル</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">本文</label>
                  <textarea
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition"
                  >
                    更新保存
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ベルアイコン用 全件お知らせモーダル */}
      {isAllNoticeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setIsAllNoticeModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 border-b pb-3">
              <Image src="/icons/notice.png" alt="ベル" width={28} height={28} />
              <h3 className="text-lg font-bold text-gray-800">お知らせ・通知センター詳細</h3>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {announcements.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">お知らせはありません。</p>
              ) : (
                announcements.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      handleOpenNoticeModal(item);
                      setIsAllNoticeModalOpen(false);
                    }}
                    className="p-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition space-y-1"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-blue-600">{item.category}</span>
                      <span className="text-gray-400 font-mono">{item.date}</span>
                    </div>
                    <div className="font-bold text-sm text-gray-800">{item.title}</div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setIsAllNoticeModalOpen(false)}
                className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded-xl text-sm hover:bg-gray-300 transition"
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