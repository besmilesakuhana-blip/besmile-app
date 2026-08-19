import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await prisma.topSetting.findUnique({
      where: { id: 'top_settings' },
    });
    return NextResponse.json(setting || {}, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json({ error: '取得エラー' }, { status: 500 });
  }
}

// PUT: トップ・サイト設定の更新 ＆ お知らせ自動生成
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { heroTitle, heroSubtitle, aboutDescription, mainImageUrl } = body;

    const updatedSetting = await prisma.topSetting.upsert({
      where: { id: 'top_settings' },
      update: {
        heroTitle,
        heroSubtitle,
        aboutDescription,
        mainImageUrl,
      },
      create: {
        id: 'top_settings',
        heroTitle: heroTitle || 'クリエイターとして働く。\n企業の力になる。',
        heroSubtitle: heroSubtitle || '',
        aboutDescription: aboutDescription || '',
        mainImageUrl: mainImageUrl || '[]',
      },
    });

    // ★ お知らせ・通知を自動生成
    try {
      await prisma.announcement.create({
        data: {
          title: '【設定変更】トップ・サイト設定が更新されました',
          category: '更新情報',
          content: `メインキャッチコピー:\n${heroTitle || '未設定'}\n\nサイト紹介文:\n${aboutDescription || '未設定'}`,
        },
      });
    } catch (noticeErr) {
      console.warn('お知らせ自動生成エラー:', noticeErr);
    }

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error('トップ設定更新エラー:', error);
    return NextResponse.json({ error: '保存エラー' }, { status: 500 });
  }
}