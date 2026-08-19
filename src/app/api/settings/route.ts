import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: 設定情報の取得
export async function GET() {
  try {
    let setting = await prisma.setting.findFirst();

    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          id: 'site_settings',
          siteTitle: 'BE SMILE',
          contactEmail: 'admin@example.com',
          mainImageUrl: '/icons/top.png',
          smtpUser: process.env.SMTP_USER || '',
          smtpPass: process.env.SMTP_PASS || '',
        },
      });
    }

    return NextResponse.json(setting, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: '取得エラー' }, { status: 500 });
  }
}

// PUT: 設定情報の更新（データベースに直接保存）
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { siteTitle, siteUrl, contactEmail, mainImageUrl, smtpUser, smtpPass } = body;

    const updatedSetting = await prisma.setting.upsert({
      where: { id: 'site_settings' },
      update: {
        siteTitle: siteTitle || 'BE SMILE',
        siteUrl: siteUrl || '',
        contactEmail: contactEmail || 'admin@example.com',
        mainImageUrl: mainImageUrl || '/icons/top.png',
        ...(smtpUser !== undefined ? { smtpUser } : {}),
        ...(smtpPass !== undefined ? { smtpPass } : {}),
      },
      create: {
        id: 'site_settings',
        siteTitle: siteTitle || 'BE SMILE',
        siteUrl: siteUrl || '',
        contactEmail: contactEmail || 'admin@example.com',
        mainImageUrl: mainImageUrl || '/icons/top.png',
        smtpUser: smtpUser || '',
        smtpPass: smtpPass || '',
      },
    });

    return NextResponse.json({ success: true, setting: updatedSetting });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: '保存エラー' }, { status: 500 });
  }
}