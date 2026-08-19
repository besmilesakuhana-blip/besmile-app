import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await prisma.topSetting.findUnique({
      where: { id: 'top_settings' },
    });

    if (!setting) {
      return NextResponse.json(
        {
          headerLogoType: 'text',
          headerLogoUrl: '/icons/top.png',
          headerLogoText: 'BeSmile',
          footerLogoType: 'text',
          footerLogoUrl: '/icons/top.png',
          footerLogoText: 'BeSmile',
          footerComment: '',
          instagramUrl: 'https://www.instagram.com/besmile_higashimikuni/?hl=ja',
          twitterUrl: 'https://x.com/bsma13a',
        },
        {
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      );
    }

    let parsed: any = {};
    if (setting.heroSubtitle) {
      try {
        parsed = JSON.parse(setting.heroSubtitle);
      } catch (e) {}
    }

    return NextResponse.json(
      {
        headerLogoType: parsed.headerLogoType || 'text',
        headerLogoUrl: setting.aboutTitle || '/icons/top.png',
        headerLogoText: parsed.headerLogoText || 'BeSmile',
        footerLogoType: parsed.footerLogoType || 'text',
        footerLogoUrl: setting.footerLogoUrl || '/icons/top.png',
        footerLogoText: setting.footerLogoText || 'BeSmile',
        footerComment: setting.aboutDescription || '',
        instagramUrl: parsed.instagramUrl || 'https://www.instagram.com/besmile_higashimikuni/?hl=ja',
        twitterUrl: parsed.twitterUrl || 'https://x.com/bsma13a',
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      {
        headerLogoType: 'text',
        headerLogoUrl: '/icons/top.png',
        headerLogoText: 'BeSmile',
        footerLogoType: 'text',
        footerLogoUrl: '/icons/top.png',
        footerLogoText: 'BeSmile',
        footerComment: '',
        instagramUrl: 'https://www.instagram.com/besmile_higashimikuni/?hl=ja',
        twitterUrl: 'https://x.com/bsma13a',
      },
      { status: 200 }
    );
  }
}

// PUT: ヘッダー・フッター設定更新 ＆ お知らせ自動生成
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      headerLogoType,
      headerLogoUrl,
      headerLogoText,
      footerLogoType,
      footerLogoUrl,
      footerLogoText,
      footerComment,
      instagramUrl,
      twitterUrl,
    } = body;

    const current = await prisma.topSetting.findUnique({
      where: { id: 'top_settings' },
    });

    let currentSubtitleData: any = {};
    if (current?.heroSubtitle) {
      try {
        currentSubtitleData = JSON.parse(current.heroSubtitle);
      } catch (e) {}
    }

    const updatedSubtitleData = {
      ...currentSubtitleData,
      headerLogoType,
      headerLogoText,
      footerLogoType,
      instagramUrl,
      twitterUrl,
    };

    const updated = await prisma.topSetting.upsert({
      where: { id: 'top_settings' },
      update: {
        aboutTitle: headerLogoUrl,
        aboutDescription: footerComment,
        footerLogoUrl: footerLogoUrl,
        footerLogoText: footerLogoText,
        heroSubtitle: JSON.stringify(updatedSubtitleData),
      },
      create: {
        id: 'top_settings',
        heroTitle: 'クリエイターとして働く。\n企業の力になる。',
        aboutTitle: headerLogoUrl || '/icons/top.png',
        aboutDescription: footerComment || '',
        footerLogoUrl: footerLogoUrl || '/icons/top.png',
        footerLogoText: footerLogoText || 'BeSmile',
        heroSubtitle: JSON.stringify(updatedSubtitleData),
      },
    });

    // ★ お知らせ・通知を自動生成
    try {
      await prisma.announcement.create({
        data: {
          title: '【設定変更】ヘッダー/フッターの設定が更新されました',
          category: '更新情報',
          content: `ヘッダーロゴ: ${headerLogoType === 'text' ? headerLogoText || 'BeSmile' : '画像ロゴ'}\nフッターロゴ: ${footerLogoType === 'text' ? footerLogoText || 'BeSmile' : '画像ロゴ'}\nフッターコメント: ${footerComment ? '設定あり' : '未設定'}\nSNSリンク: Instagram / X を更新`,
        },
      });
    } catch (noticeErr) {
      console.warn('お知らせ自動生成エラー:', noticeErr);
    }

    return NextResponse.json({ success: true, setting: updated });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: '保存に失敗しました。' }, { status: 500 });
  }
}