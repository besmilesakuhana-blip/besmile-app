import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 60;

    const photos = await prisma.photo.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        url: true,
        category: true,
        createdAt: true,
      },
    });
    return NextResponse.json(photos);
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, url, category } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: '写真名とURLは必須です' },
        { status: 400 }
      );
    }

    const newPhoto = await prisma.photo.create({
      data: {
        name,
        url,
        category: category || '一般',
      },
    });

    return NextResponse.json(newPhoto, { status: 201 });
  } catch (error) {
    console.error('Failed to create photo detail error:', error);
    return NextResponse.json(
      { error: '写真の保存に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '削除対象のIDが必要です' },
        { status: 400 }
      );
    }

    await prisma.photo.delete({
      where: { id },
    });

    return NextResponse.json({ message: '素材を削除しました' });
  } catch (error) {
    console.error('Failed to delete photo:', error);
    return NextResponse.json(
      { error: '素材の削除に失敗しました' },
      { status: 500 }
    );
  }
}