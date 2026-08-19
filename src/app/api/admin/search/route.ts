import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q || !q.trim() || q.trim().length < 1) {
    return NextResponse.json([]);
  }

  const query = q.trim();

  try {
    // 1. 写真・メディア素材本体の検索
    const photos = await prisma.photo.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 3,
      select: {
        id: true,
        name: true,
        url: true, // 逆引き用
      },
    });

    const photoUrls = photos.map((p) => p.url).filter(Boolean);

    // 2〜7. 残りの全検索クエリを Promise.all で並列実行＆ select でカラム制限
    const [
      worksUsingPhoto,
      creatorsUsingPhoto,
      works,
      creators,
      inquiries,
      users,
      adminUsers,
    ] = await Promise.all([
      // 2. 該当画像を使用している「作品」
      photoUrls.length > 0
        ? prisma.work.findMany({
            where: { imageUrl: { in: photoUrls } },
            take: 3,
            select: { id: true, title: true, category: true },
          })
        : Promise.resolve([]),

      // 3. 該当画像を使用している「クリエイター」
      photoUrls.length > 0
        ? prisma.creator.findMany({
            where: { avatarUrl: { in: photoUrls } },
            take: 3,
            select: { id: true, name: true, role: true },
          })
        : Promise.resolve([]),

      // 4. 通常の作品検索（description等の大容量列は取得しない）
      prisma.work.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
        select: { id: true, title: true, category: true },
      }),

      // 5. 通常のクリエイター検索（bio等の大容量列は取得しない）
      prisma.creator.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { role: { contains: query, mode: 'insensitive' } },
            { skills: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
        select: { id: true, name: true, role: true },
      }),

      // 6. お問い合わせ検索（message本文は取得しない）
      prisma.inquiry.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { message: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
        select: { id: true, name: true, email: true, status: true },
      }),

      // 7. アカウント管理検索（パスワード列を確実に除外）
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
        select: { id: true, name: true, email: true },
      }),

      prisma.adminUser.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 3,
        select: { id: true, name: true, email: true },
      }),
    ]);

    const combinedAccounts = [...users, ...adminUsers].filter(
      (account, index, self) => index === self.findIndex((a) => a.id === account.id)
    );

    // 検索結果の整形・まとめ
    const results = [
      // 写真・メディア素材
      ...photos.map((p) => ({
        id: p.id,
        title: p.name,
        sub: `写真・メディア素材 / プレビュー`,
        path: `/admin/photos?id=${p.id}`,
        type: 'photo',
      })),
      // 写真を使っている作品
      ...worksUsingPhoto.map((w) => ({
        id: w.id,
        title: `【使用先作品】${w.title}`,
        sub: `投稿/作品 / ${w.category}`,
        path: `/admin/works?id=${w.id}&category=${encodeURIComponent(w.category)}`,
        type: 'work',
      })),
      // 写真を使っているクリエイター
      ...creatorsUsingPhoto.map((c) => ({
        id: c.id,
        title: `【使用先クリエイター】${c.name}`,
        sub: `クリエイター管理 / ${c.role || '未設定'}`,
        path: `/admin/creators?id=${c.id}&role=${encodeURIComponent(c.role || '')}`,
        type: 'creator',
      })),
      // 通常の作品ヒット結果
      ...works
        .filter((w) => !worksUsingPhoto.some((uw) => uw.id === w.id))
        .map((w) => ({
          id: w.id,
          title: w.title,
          sub: `作品 / ${w.category}`,
          path: `/admin/works?id=${w.id}&category=${encodeURIComponent(w.category)}`,
          type: 'work',
        })),
      // 通常のクリエイターヒット結果
      ...creators
        .filter((c) => !creatorsUsingPhoto.some((uc) => uc.id === c.id))
        .map((c) => ({
          id: c.id,
          title: c.name,
          sub: `クリエイター / ${c.role || '未設定'}`,
          path: `/admin/creators?id=${c.id}&role=${encodeURIComponent(c.role || '')}`,
          type: 'creator',
        })),
      // お問い合わせ
      ...inquiries.map((i) => ({
        id: i.id,
        title: `${i.name}様 (${i.email})`,
        sub: `お問い合わせ / ${i.status}`,
        path: `/admin/inquiries?id=${i.id}`,
        type: 'inquiry',
      })),
      // アカウント
      ...combinedAccounts.map((a) => ({
        id: a.id,
        title: `${a.name || '管理者'} (${a.email})`,
        sub: `アカウント管理`,
        path: `/admin/accounts?id=${a.id}`,
        type: 'account',
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}