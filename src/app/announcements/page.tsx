import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 60; // 60秒キャッシュ

// お知らせ一覧ページ（Server Component）
export default async function AnnouncementsPage() {
  // データベースから新しい順で最大30件取得
  const announcements = await prisma.announcement.findMany({
    take: 30,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      category: true,
      content: true,
      createdAt: true,
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* ページヘッダー */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">お知らせ一覧</h1>
        <p className="text-gray-600 mt-2">
          BeSmile からの最新ニュースやメンテナンス情報をお届けします。
        </p>
      </div>

      {/* お知らせリスト */}
      {announcements.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">現在お知らせはありません。</p>
      ) : (
        <div className="space-y-6">
          {announcements.map((item) => (
            <article
              key={item.id}
              className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {/* カテゴリバッジ */}
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  {item.category}
                </span>

                {/* 投稿日時 */}
                <time className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </time>
              </div>

              {/* タイトル */}
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {item.title}
              </h2>

              {/* 本文 */}
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* トップへ戻るリンク */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← トップページへ戻る
        </Link>
      </div>
    </div>
  );
}