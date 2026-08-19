'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type InquiryItem = {
  id: string;
  name: string;
  email: string;
  content: string;
  date: string;
  status: string;
  messages: Array<{ sender: string; text: string; date: string }>;
};

const ITEMS_PER_PAGE = 5;

function parseInquiryMessages(rawMessage: string, formattedDate: string) {
  const parsedMessages: Array<{ sender: string; text: string; date: string }> = [];
  const regex = /(---ADMIN_REPLY---|---USER_REPLY---)/g;
  const tokens = rawMessage.split(regex);

  parsedMessages.push({
    sender: 'user',
    text: tokens[0].trim(),
    date: formattedDate,
  });

  for (let i = 1; i < tokens.length; i += 2) {
    const type = tokens[i];
    const text = tokens[i + 1]?.trim() || '';
    if (type === '---ADMIN_REPLY---') {
      parsedMessages.push({ sender: 'admin', text, date: formattedDate });
    } else if (type === '---USER_REPLY---') {
      parsedMessages.push({ sender: 'user', text, date: formattedDate });
    }
  }

  return { content: tokens[0].trim(), parsedMessages };
}

export default function InquiriesPage() {
  const [activeTab, setActiveTab] = useState<'mail' | 'settings'>('mail');
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userReplyText, setUserReplyText] = useState('');
  const [isAddUserReplyOpen, setIsAddUserReplyOpen] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const [autoReplyEmail, setAutoReplyEmail] = useState(
    'お問い合わせありがとうございます。メッセージを受け付けました。担当者より折り返しご連絡いたします。'
  );
  const [msgSuccess, setMsgSuccess] = useState('メッセージは正常に送信されました。');
  const [msgFail, setMsgFail] = useState('メッセージの送信に失敗しました。時間をおいて再度お試しください。');
  const [msgInvalidInput, setMsgInvalidInput] = useState('入力内容に不備があります。確認して再度入力してください。');
  const [msgMissingItem, setMsgMissingItem] = useState('必須項目が入力されていません。');

  const fetchInquiries = async (forceRefresh = false) => {
    try {
      const fetchOption: RequestInit = forceRefresh
        ? { cache: 'reload' }
        : { next: { revalidate: 60 } };

      const [resInquiries, resSettings] = await Promise.all([
        fetch('/api/inquiries', fetchOption),
        fetch('/api/inquiries?type=settings', fetchOption),
      ]);

      if (resInquiries.ok) {
        const data = await resInquiries.json();
        const formattedInquiries: InquiryItem[] = data.map((item: any) => {
          const rawMessage = item.message || item.content || '';
          const formattedDate = new Date(item.createdAt || Date.now()).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });

          const { content, parsedMessages } = parseInquiryMessages(rawMessage, formattedDate);

          return {
            id: item.id,
            name: item.name,
            email: item.email,
            content,
            status: item.status || '未対応',
            date: formattedDate,
            messages: parsedMessages,
          };
        });
        setInquiries(formattedInquiries);
        return formattedInquiries;
      }

      if (resSettings.ok) {
        const dataSettings = await resSettings.json();
        if (dataSettings?.heroSubtitle) {
          try {
            const parsed = JSON.parse(dataSettings.heroSubtitle);
            if (parsed.autoReplyEmail) setAutoReplyEmail(parsed.autoReplyEmail);
            if (parsed.msgSuccess) setMsgSuccess(parsed.msgSuccess);
            if (parsed.msgFail) setMsgFail(parsed.msgFail);
            if (parsed.msgInvalidInput) setMsgInvalidInput(parsed.msgInvalidInput);
            if (parsed.msgMissingItem) setMsgMissingItem(parsed.msgMissingItem);
          } catch (e) {}
        }
      }
    } catch (error) {
      console.error('お問い合わせの取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchInquiries();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddUserReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userReplyText || !selectedInquiry) return;

    try {
      const res = await fetch('/api/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInquiry.id,
          isUserReply: true,
          userReplyText: userReplyText,
        }),
      });

      if (!res.ok) throw new Error('保存エラー');

      alert('相手からの返信内容をログに記録しました！');
      setUserReplyText('');
      setIsAddUserReplyOpen(false);

      const latestList = await fetchInquiries(true);
      if (latestList) {
        const currentUpdated = latestList.find((item) => item.id === selectedInquiry.id);
        if (currentUpdated) setSelectedInquiry(currentUpdated);
      }
    } catch (error) {
      console.error(error);
      alert('ログの記録に失敗しました。');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !selectedInquiry) return;

    setIsSendingReply(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInquiry.id,
          email: selectedInquiry.email,
          replyText: replyText,
          status: '対応済み',
        }),
      });

      if (!res.ok) throw new Error('返信送信に失敗しました');

      alert(`「${selectedInquiry.email}」へ返信メールを送信し、履歴を保存しました！`);
      setReplyText('');

      const latestList = await fetchInquiries(true);
      if (latestList) {
        const currentUpdated = latestList.find((item) => item.id === selectedInquiry.id);
        if (currentUpdated) setSelectedInquiry(currentUpdated);
      }
    } catch (error) {
      console.error('返信エラー:', error);
      alert('送信に失敗しました。');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedInquiry) return;

    try {
      const res = await fetch('/api/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInquiry.id,
          status,
        }),
      });

      if (!res.ok) throw new Error('ステータス更新に失敗しました');

      const updated = { ...selectedInquiry, status };
      setInquiries(inquiries.map((item) => (item.id === selectedInquiry.id ? updated : item)));
      setSelectedInquiry(updated);
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータスの変更に失敗しました。');
    }
  };

  const handleDeleteInquiry = async () => {
    if (!selectedInquiry) return;
    if (confirm(`「${selectedInquiry.name}」様のお問い合わせを削除してもよろしいですか？`)) {
      try {
        const res = await fetch(`/api/inquiries?id=${selectedInquiry.id}`, {
          method: 'DELETE',
        });

        if (!res.ok) throw new Error('削除に失敗しました');

        setInquiries(inquiries.filter((item) => item.id !== selectedInquiry.id));
        setSelectedInquiry(null);
        alert('削除しました。');
      } catch (error) {
        console.error('削除エラー:', error);
        alert('削除に失敗しました。');
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isSettings: true,
          settingsData: {
            autoReplyEmail,
            msgSuccess,
            msgFail,
            msgInvalidInput,
            msgMissingItem,
          },
        }),
      });

      if (!res.ok) throw new Error('保存エラー');
      alert('お問い合わせ設定を保存しました！');
    } catch (error) {
      console.error(error);
      alert('設定の保存に失敗しました。');
    }
  };

  const totalPages = Math.ceil(inquiries.length / ITEMS_PER_PAGE) || 1;
  const paginatedInquiries = inquiries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">お問い合わせ管理</h1>
        <Image
          src="/icons/inquiries.png"
          alt="お問い合わせアイコン"
          width={48}
          height={48}
          className="object-contain"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => setActiveTab('mail')}
          className={`px-8 py-2 rounded-xl text-sm font-medium border shadow-xs transition ${
            activeTab === 'mail'
              ? 'bg-[#DDE7F3] border-blue-200 text-gray-800 font-bold scale-105'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          メール
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-8 py-2 rounded-xl text-sm font-medium border shadow-xs transition ${
            activeTab === 'settings'
              ? 'bg-[#ECE0EE] border-purple-200 text-gray-800 font-bold scale-105'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          設定
        </button>
      </div>

      {activeTab === 'mail' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="grid grid-cols-12 bg-[#DDE7F3] py-3 px-6 text-gray-700 font-medium">
            <div className="col-span-3">名前</div>
            <div className="col-span-5">内容</div>
            <div className="col-span-2 text-center">受信日</div>
            <div className="col-span-2 text-right pr-4">対応</div>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-12 text-center text-gray-400">読み込み中...</div>
            ) : paginatedInquiries.length > 0 ? (
              paginatedInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className="grid grid-cols-12 items-center p-4 hover:bg-gray-50 transition cursor-pointer"
                >
                  <div className="col-span-3 font-medium text-gray-800 truncate pr-2">
                    {inquiry.name}
                  </div>
                  <div className="col-span-5 text-gray-600 text-sm line-clamp-1 pr-4">
                    {inquiry.content}
                  </div>
                  <div className="col-span-2 text-center text-gray-600 font-mono text-sm">
                    {inquiry.date}
                  </div>
                  <div className="col-span-2 text-right pr-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        inquiry.status === '対応済み'
                          ? 'bg-green-100 text-green-700'
                          : inquiry.status === '対応中'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {inquiry.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-400 py-16">
                受信したお問い合わせはありません。
              </div>
            )}
          </div>

          <div className="flex justify-end items-center gap-2 p-6 bg-white border-t">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${
                  currentPage === page
                    ? 'bg-gray-600 text-white font-bold'
                    : 'border border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="space-y-8 max-w-4xl pt-4 bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-6">
            <label className="md:col-span-4 text-gray-700 font-medium text-base pt-2">
              自動返信メール文面
            </label>
            <div className="md:col-span-8">
              <textarea
                value={autoReplyEmail}
                onChange={(e) => setAutoReplyEmail(e.target.value)}
                rows={6}
                className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm shadow-xs leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t">
            <div className="text-gray-800 font-bold text-base">システムメッセージ通知設定</div>

            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
              <label className="md:col-span-4 text-gray-600 text-sm font-medium">正常送信時</label>
              <input
                type="text"
                value={msgSuccess}
                onChange={(e) => setMsgSuccess(e.target.value)}
                className="md:col-span-8 p-3 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
              <label className="md:col-span-4 text-gray-600 text-sm font-medium">送信失敗時</label>
              <input
                type="text"
                value={msgFail}
                onChange={(e) => setMsgFail(e.target.value)}
                className="md:col-span-8 p-3 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
              <label className="md:col-span-4 text-gray-600 text-sm font-medium">入力内容不備</label>
              <input
                type="text"
                value={msgInvalidInput}
                onChange={(e) => setMsgInvalidInput(e.target.value)}
                className="md:col-span-8 p-3 border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
              <label className="md:col-span-4 text-gray-600 text-sm font-medium">必須項目未入力</label>
              <input
                type="text"
                value={msgMissingItem}
                onChange={(e) => setMsgMissingItem(e.target.value)}
                className="md:col-span-8 p-3 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              className="px-8 py-3 bg-[#ECE0EE] hover:bg-[#dfd0e2] text-gray-800 font-bold rounded-xl shadow-sm transition"
            >
              設定を保存
            </button>
          </div>
        </form>
      )}

      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-4 right-4 text-gray-400 font-bold text-xl"
            >
              ✕
            </button>

            <div className="border-b pb-3 flex justify-between items-start pr-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedInquiry.name} 様からのお問い合わせ
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  {selectedInquiry.email} / 受信: {selectedInquiry.date}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddUserReplyOpen(!isAddUserReplyOpen)}
                className="text-xs font-semibold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition"
              >
                {isAddUserReplyOpen ? '✕ 閉じる' : '📩 相手の返信を記録'}
              </button>
            </div>

            {isAddUserReplyOpen && (
              <form
                onSubmit={handleAddUserReply}
                className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2"
              >
                <label className="block text-xs font-bold text-amber-900">
                  受信メールソフト等で受け取った相手（{selectedInquiry.name} 様）の返信文面を入力して追記
                </label>
                <textarea
                  value={userReplyText}
                  onChange={(e) => setUserReplyText(e.target.value)}
                  placeholder="メールソフトで受け取った相手の返信本文を貼り付けてください..."
                  rows={2}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!userReplyText}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs rounded-lg shadow-sm transition"
                  >
                    チャットログに記録する 💾
                  </button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[200px] max-h-[300px]">
              {(selectedInquiry.messages || []).map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-gray-400 mb-1">
                    {msg.sender === 'admin' ? '管理者 (あなた)' : selectedInquiry.name} • {msg.date}
                  </div>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm ${
                      msg.sender === 'admin'
                        ? 'bg-[#DDE7F3] text-gray-800 rounded-tr-none font-medium'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendReply} className="space-y-3 pt-2">
              <label className="block text-sm font-bold text-gray-700">返信メールを作成</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="返信メールの文面を入力してください..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
              />

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleDeleteInquiry}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition"
                >
                  🗑 削除する
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {['未対応', '対応中', '対応済み'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                          selectedInquiry.status === st
                            ? 'bg-gray-700 text-white'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={!replyText || isSendingReply}
                    className="px-6 py-2 bg-[#DAE6DC] hover:bg-[#c8d8ca] disabled:opacity-40 text-gray-800 font-bold rounded-xl shadow-sm text-sm transition"
                  >
                    {isSendingReply ? '送信中...' : 'メールを送信する ✉️'}
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