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

function buildDescription(description: string, subImages: string[]) {
  let cleanDesc = description || '';
  for (const marker of [SUB_IMAGE_MARKER, OLD_SUB_IMAGE_MARKER]) {
    if (cleanDesc.includes(marker)) {
      cleanDesc = cleanDesc.split(marker)[0];
    }
  }
  cleanDesc = cleanDesc.trim();

  if (Array.isArray(subImages) && subImages.length > 0) {
    return `${cleanDesc}\n\n${SUB_IMAGE_MARKER}${JSON.stringify(subImages)}`;
  }
  return cleanDesc;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 50;

    const works = await prisma.work.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        imageUrl: true,
        description: true,
        createdAt: true,
        creatorId: true,
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    const formattedWorks = works.map((work) => {
      const { description, subImages } = parseDescription(work.description);
      return {
        ...work,
        description,
        subImages,
      };
    });

    return NextResponse.json(formattedWorks, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('GET Works Error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: 新規作品の追加 ＆ お知らせ自動生成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, imageUrl, description, creatorId, subImages } = body;

    if (!title) {
      return NextResponse.json({ error: 'タイトルは必須です' }, { status: 400 });
    }

    const fullDescription = buildDescription(description, subImages || []);

    const newWork = await prisma.work.create({
      data: {
        title,
        category: category || '動画',
        imageUrl: imageUrl || '/icons/works.png',
        description: fullDescription,
        ...(creatorId ? { creatorId } : {}),
      },
    });

    // ★ お知らせ・通知を自動生成
    try {
      await prisma.announcement.create({
        data: {
          title: `【投稿/作品】「${newWork.title}」が新しく追加されました`,
          category: '更新情報',
          content: `作品名: ${newWork.title}\nジャンル: ${newWork.category}\n説明:\n${description || '詳細説明なし'}`,
        },
      });
    } catch (noticeErr) {
      console.warn('お知らせ自動生成エラー:', noticeErr);
    }

    const parsed = parseDescription(newWork.description);
    return NextResponse.json(
      { ...newWork, description: parsed.description, subImages: parsed.subImages },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Work Error:', error);
    return NextResponse.json({ error: '作成失敗' }, { status: 500 });
  }
}

// PUT: 作品の更新
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, category, imageUrl, description, creatorId, subImages } = body;

    if (!id || !title) {
      return NextResponse.json({ error: 'IDとタイトルは必須です' }, { status: 400 });
    }

    const fullDescription = buildDescription(description, subImages || []);

    const updatedWork = await prisma.work.update({
      where: { id },
      data: {
        title,
        category: category || '動画',
        imageUrl: imageUrl || '/icons/works.png',
        description: fullDescription,
        creatorId: creatorId || null,
      },
    });

    const parsed = parseDescription(updatedWork.description);
    return NextResponse.json({
      ...updatedWork,
      description: parsed.description,
      subImages: parsed.subImages,
    });
  } catch (error) {
    console.error('PUT Work Error:', error);
    return NextResponse.json({ error: '更新失敗' }, { status: 500 });
  }
}

// DELETE: 作品の削除
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    await prisma.work.delete({
      where: { id },
    });

    return NextResponse.json({ message: '削除完了' });
  } catch (error) {
    console.error('DELETE Work Error:', error);
    return NextResponse.json({ error: '削除失敗' }, { status: 500 });
  }
}