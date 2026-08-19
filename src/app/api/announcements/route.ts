import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 30;
    const isSummary = searchParams.get('summary') === 'true';

    const announcements = await prisma.announcement.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true,
        // 要約（summary）取得時は本文を除外して転送量を削減
        ...(!isSummary && { content: true }),
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error('GET Announcements Error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'タイトルと本文は必須です' },
        { status: 400 }
      );
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        category: category || 'お知らせ',
        content,
      },
    });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error('POST Announcement Error:', error);
    return NextResponse.json({ error: '作成失敗' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, category, content } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'ID、タイトル、本文は必須です' },
        { status: 400 }
      );
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        category: category || 'お知らせ',
        content,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT Announcement Error:', error);
    return NextResponse.json({ error: '更新失敗' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ message: '削除完了' });
  } catch (error) {
    console.error('DELETE Announcement Error:', error);
    return NextResponse.json({ error: '削除失敗' }, { status: 500 });
  }
}