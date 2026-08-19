import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET: 設定情報および現在のSMTP設定の取得
export async function GET() {
  try {
    const setting = await prisma.setting.findFirst();

    // Node.js環境変数から現在のSMTP設定を取得
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';

    return NextResponse.json(
      {
        ...setting,
        smtpUser,
        smtpPass,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: '取得エラー' }, { status: 500 });
  }
}

// PUT: 設定情報の更新 ＆ .env.local への書き込み
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { siteTitle, siteUrl, contactEmail, mainImageUrl, smtpUser, smtpPass } = body;

    // 1. データベース（Prisma）の更新
    const updatedSetting = await prisma.setting.upsert({
      where: { id: 'site_settings' },
      update: {
        siteTitle: siteTitle || 'BE SMILE',
        contactEmail: contactEmail || 'admin@example.com',
        mainImageUrl: mainImageUrl || '/icons/top.png',
      },
      create: {
        id: 'site_settings',
        siteTitle: siteTitle || 'BE SMILE',
        contactEmail: contactEmail || 'admin@example.com',
        mainImageUrl: mainImageUrl || '/icons/top.png',
      },
    });

    // 2. .env.local ファイルの動的書き換え処理
    if (smtpUser !== undefined || smtpPass !== undefined) {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = '';

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // SMTP_USER の更新
      if (smtpUser !== undefined) {
        process.env.SMTP_USER = smtpUser;
        if (envContent.includes('SMTP_USER=')) {
          envContent = envContent.replace(/SMTP_USER=.*$/m, `SMTP_USER=${smtpUser}`);
        } else {
          envContent += `\nSMTP_USER=${smtpUser}`;
        }
      }

      // SMTP_PASS の更新
      if (smtpPass !== undefined) {
        const cleanPass = smtpPass.replace(/"/g, '');
        process.env.SMTP_PASS = cleanPass;
        if (envContent.includes('SMTP_PASS=')) {
          envContent = envContent.replace(/SMTP_PASS=.*$/m, `SMTP_PASS="${cleanPass}"`);
        } else {
          envContent += `\nSMTP_PASS="${cleanPass}"`;
        }
      }

      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    }

    return NextResponse.json({ success: true, setting: updatedSetting });
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ error: '保存エラー' }, { status: 500 });
  }
}