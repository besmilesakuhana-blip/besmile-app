import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const SUB_IMAGE_MARKER = '___SUB_IMAGES_JSON___:';
const OLD_SUB_IMAGE_MARKER = '__SUB_IMAGES__:';

function parseDescription(raw: string | null) {
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
}

// GET: クリエイター一覧取得
export async function GET() {
  try {
    const creators = await prisma.creator.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        role: true,
        skills: true,
        bio: true,
        avatarUrl: true,
        works: {
          select: {
            id: true,
            title: true,
            category: true,
            imageUrl: true,
            description: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 4,
        },
      },
    });

    const formattedCreators = creators.map((creator) => ({
      ...creator,
      works: creator.works.map((work) => {
        const { description, subImages } = parseDescription(work.description);
        return {
          ...work,
          description,
          subImages,
        };
      }),
    }));

    return NextResponse.json(formattedCreators, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('GET Creators Error:', error);
    return NextResponse.json({ error: 'データ取得エラー' }, { status: 500 });
  }
}

// POST: 新規クリエイター追加 ＆ お知らせ自動生成
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, role, skills, bio, avatarUrl, works } = body;

    if (!name) {
      return NextResponse.json({ error: '名前が必要です' }, { status: 400 });
    }

    const newCreator = await prisma.creator.create({
      data: {
        name: String(name),
        role: role ? String(role) : '動画',
        skills: skills ? String(skills) : '',
        bio: bio ? String(bio) : '',
        avatarUrl: avatarUrl ? String(avatarUrl) : '/icons/creatorhukusuu.png',
      },
    });

    if (Array.isArray(works) && works.length > 0) {
      try {
        await prisma.work.updateMany({
          where: {
            id: { in: works },
          },
          data: {
            creatorId: newCreator.id,
          },
        });
      } catch (workErr) {
        console.warn('作品紐付けエラー:', workErr);
      }
    }

    // ★ お知らせ・通知を自動生成
    try {
      await prisma.announcement.create({
        data: {
          title: `【クリエイター】「${newCreator.name}」さんが新しく登録されました`,
          category: '更新情報',
          content: `名前: ${newCreator.name}\n担当ジャンル: ${newCreator.role}\nスキル: ${newCreator.skills || '未設定'}\n自己紹介:\n${newCreator.bio || 'プロフィールなし'}`,
        },
      });
    } catch (noticeErr) {
      console.warn('お知らせ自動生成エラー:', noticeErr);
    }

    return NextResponse.json(newCreator, { status: 201 });
  } catch (error: any) {
    console.error('POST Creator Error:', error);
    return NextResponse.json(
      { error: 'クリエイターの保存に失敗しました。' },
      { status: 500 }
    );
  }
}

// PUT: クリエイター更新
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, role, skills, bio, avatarUrl, works } = body;

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    const updatedCreator = await prisma.creator.update({
      where: { id },
      data: {
        name: String(name),
        role: String(role),
        skills: String(skills || ''),
        bio: String(bio || ''),
        avatarUrl: avatarUrl ? String(avatarUrl) : '/icons/creatorhukusuu.png',
      },
    });

    try {
      await prisma.work.updateMany({
        where: { creatorId: id },
        data: { creatorId: null },
      });

      if (Array.isArray(works) && works.length > 0) {
        await prisma.work.updateMany({
          where: {
            id: { in: works },
          },
          data: {
            creatorId: id,
          },
        });
      }
    } catch (workErr) {
      console.warn('作品紐付け更新エラー:', workErr);
    }

    return NextResponse.json(updatedCreator);
  } catch (error: any) {
    console.error('PUT Creator Error:', error);
    return NextResponse.json(
      { error: 'クリエイターの更新に失敗しました。' },
      { status: 500 }
    );
  }
}

// DELETE: クリエイター削除
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
  }

  try {
    await prisma.creator.delete({
      where: { id },
    });
    return NextResponse.json({ message: '削除完了' });
  } catch (error) {
    console.error('DELETE Creator Error:', error);
    return NextResponse.json({ error: '削除失敗' }, { status: 500 });
  }
}