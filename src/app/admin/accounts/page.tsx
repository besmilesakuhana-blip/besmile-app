'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

type AccountItem = {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  date: string;
  iconUrl: string;
};

const ITEMS_PER_PAGE = 5;

function AccountsContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // モーダル管理ステート
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);

  // フォーム用入力ステート
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('編集者');
  const [formStatus, setFormStatus] = useState('有効');
  const [formPassword, setFormPassword] = useState('');

  // 🔄 データベースからアカウント一覧を取得
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      const formattedAccounts: AccountItem[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        role: item.role || '管理者',
        email: item.email,
        status: item.status || '有効',
        date: new Date(item.createdAt || Date.now()).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        iconUrl: '/icons/creators.png',
      }));

      setAccounts(formattedAccounts);

      // ★ 検索遷移時：該当アカウントがある「ページ番号」を自動割り出し＆自動切り替え・モーダル表示
      if (targetId) {
        const targetIndex = formattedAccounts.findIndex((a) => a.id === targetId);
        if (targetIndex !== -1) {
          const calculatedPage = Math.floor(targetIndex / ITEMS_PER_PAGE) + 1;
          setCurrentPage(calculatedPage);
          handleOpenEditModal(formattedAccounts[targetIndex]);
        }
      }
    } catch (error) {
      console.error('アカウント取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [targetId]);

  // 新規追加モーダルを開く
  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setFormName('');
    setFormEmail('');
    setFormRole('編集者');
    setFormStatus('有効');
    setFormPassword('');
    setIsModalOpen(true);
  };

  // 一覧のアカウントをクリックして詳細/編集モーダルを開く
  const handleOpenEditModal = (account: AccountItem) => {
    setEditingAccount(account);
    setFormName(account.name);
    setFormEmail(account.email);
    setFormRole(account.role);
    setFormStatus(account.status);
    setFormPassword(''); // 空欄のまま（変更時のみ入力）
    setIsModalOpen(true);
  };

  // 保存処理（データベースへの追加/更新）
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      alert('アカウント名とメールアドレスを入力してください。');
      return;
    }

    try {
      if (editingAccount) {
        // 更新 (PUT)
        const res = await fetch('/api/accounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAccount.id,
            name: formName,
            email: formEmail,
            role: formRole,
            status: formStatus,
            ...(formPassword ? { password: formPassword } : {}),
          }),
        });

        if (!res.ok) throw new Error('更新に失敗しました');
        alert('アカウント情報を更新しました！');
      } else {
        // 新規追加 (POST)
        if (!formPassword) {
          alert('新規追加の場合はパスワードを設定してください。');
          return;
        }

        const res = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            role: formRole,
            status: formStatus,
            password: formPassword,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || '作成に失敗しました');
        }
        alert('新規アカウントを追加しました！');
      }

      setIsModalOpen(false);
      await fetchAccounts();
    } catch (error: any) {
      console.error('保存エラー:', error);
      alert(error.message || '保存に失敗しました。');
    }
  };

  // 削除処理（データベースから削除）
  const handleDelete = async () => {
    if (!editingAccount) return;
    if (confirm(`アカウント「${editingAccount.name}」を削除してもよろしいですか？`)) {
      try {
        const res = await fetch(`/api/accounts?id=${editingAccount.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('削除に失敗しました');

        setIsModalOpen(false);
        await fetchAccounts();
        alert('アカウントを削除しました。');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました。');
      }
    }
  };

  const totalPages = Math.ceil(accounts.length / ITEMS_PER_PAGE) || 1;
  const paginatedAccounts = accounts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* 1. ページヘッダー ＆ 新規アカウント追加ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">アカウント管理</h1>
          <Image src="/icons/creators.png" alt="アカウントアイコン" width={48} height={48} className="object-contain" />
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#EFDCC9] hover:bg-[#e4ceb9] text-gray-800 font-semibold rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5"
        >
          <span className="text-xl font-bold">＋</span> 新規アカウントの追加
        </button>
      </div>

      {/* 2. アカウント一覧テーブル */}
      <div className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100">
        <div className="grid grid-cols-12 bg-[#DDE7F3] py-3 px-6 text-gray-700 font-medium">
          <div className="col-span-5 pl-2">アカウント名 / メールアドレス</div>
          <div className="col-span-3">権限</div>
          <div className="col-span-2 text-center">作成日</div>
          <div className="col-span-2 text-right pr-4">ステータス</div>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">読み込み中...</div>
          ) : paginatedAccounts.length > 0 ? (
            paginatedAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => handleOpenEditModal(account)}
                className={`grid grid-cols-12 items-center p-4 hover:bg-gray-50 transition cursor-pointer ${
                  targetId === account.id ? 'bg-[#EFDCC9]/30 border-l-4 border-[#e4ceb9]' : ''
                }`}
              >
                {/* 名前 ＆ メール */}
                <div className="col-span-5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={account.iconUrl} alt={account.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-gray-800 block text-base truncate">{account.name}</span>
                    <span className="text-xs text-gray-400 font-mono truncate block">{account.email}</span>
                  </div>
                </div>

                {/* 権限 */}
                <div className="col-span-3">
                  <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-600">
                    {account.role}
                  </span>
                </div>

                {/* 作成日 */}
                <div className="col-span-2 text-center text-gray-600 font-mono text-xs">
                  {account.date}
                </div>

                {/* ステータス */}
                <div className="col-span-2 text-right pr-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      account.status === '有効'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {account.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400">登録されたアカウントはありません。</div>
          )}
        </div>

        {/* ページネーション */}
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

      {/* 3. 詳細・編集モーダル（クリックでポップアップ表示） */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative my-8">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>

            <h2 className="text-xl font-bold text-gray-800">
              {editingAccount ? 'アカウント詳細・編集' : '新規アカウント追加'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {/* アカウント名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">アカウント名</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例: 山田 太郎"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                  required
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                  required
                />
              </div>

              {/* 権限 ＆ ステータス */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">アクセス権限</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="管理者">管理者</option>
                    <option value="編集者">編集者</option>
                    <option value="閲覧のみ">閲覧のみ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="有効">有効</option>
                    <option value="無効">無効</option>
                  </select>
                </div>
              </div>

              {/* パスワード（変更時のみ） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード {editingAccount && <span className="text-xs text-gray-400 font-normal">（変更する場合のみ入力）</span>}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingAccount ? "新しいパスワードを入力" : "パスワードを入力"}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm font-mono"
                  required={!editingAccount}
                />
              </div>

              {/* ボタン領域 */}
              <div className="flex justify-between items-center pt-4 border-t">
                {editingAccount ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-xs transition border border-red-200"
                  >
                    🗑 削除する
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#EFDCC9] hover:bg-[#e4ceb9] text-gray-800 font-bold rounded-lg shadow-xs text-sm transition"
                  >
                    {editingAccount ? '更新する' : '追加する'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-gray-400">
          アカウント管理画面を読み込み中...
        </div>
      }
    >
      <AccountsContent />
    </Suspense>
  );
}