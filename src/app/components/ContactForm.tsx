'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // ページのリロード（最上部への移動）を完全に防止
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. お問い合わせ設定メッセージを取得
      let settings = {
        msgSuccess: 'メッセージは正常に送信されました。',
        msgFail: 'メッセージの送信に失敗しました。時間をおいて再度お試しください。',
        msgMissingItem: '必須項目が入力されていません。',
      };

      try {
        const settingsRes = await fetch('/api/inquiries?type=settings', { cache: 'no-store' });
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData?.heroSubtitle) {
            const parsed = JSON.parse(settingsData.heroSubtitle);
            settings = { ...settings, ...parsed };
          }
        }
      } catch (err) {
        console.error('設定取得エラー:', err);
      }

      // 2. 必須チェック
      if (!name.trim() || !email.trim()) {
        alert(settings.msgMissingItem);
        setIsSubmitting(false);
        return;
      }

      // 3. APIへ送信
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, name, email, content }),
      });

      if (!res.ok) {
        throw new Error('送信失敗');
      }

      // 4. 設定メッセージのアラート表示
      alert(settings.msgSuccess);

      // フォーム初期化
      setCompanyName('');
      setName('');
      setEmail('');
      setContent('');
    } catch (error) {
      console.error('送信処理エラー:', error);
      alert('メッセージの送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form" noValidate>
      <div>
        <label className="block mb-2">
          <span>会社名 <b>必須</b></span>
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="例）株式会社スマイル"
          required
        />
      </div>

      <div>
        <label className="block mb-2">
          <span>ご担当者名 <b>必須</b></span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例）山田 太郎"
          required
        />
      </div>

      <div>
        <label className="block mb-2">
          <span>メールアドレス <b>必須</b></span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="例）yamada@example.co.jp"
          required
        />
      </div>

      <div>
        <label className="block mb-2">
          <span>お問い合わせ内容</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="制作のご相談内容・お見積り内容をご記入ください"
        />
      </div>

      <button
        type="submit"
        className="btn btn-blue"
        disabled={isSubmitting}
      >
        {isSubmitting ? '送信中...' : 'お問い合わせ'} <span>→</span>
      </button>
    </form>
  );
}