import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const limit = Number(searchParams.get('limit')) || 50;

  try {
    if (type === 'settings') {
      const settings = await prisma.topSetting.findUnique({
        where: { id: 'inquiry_settings' },
      });
      return NextResponse.json(settings);
    }

    const inquiries = await prisma.inquiry.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('GET Inquiries Error:', error);
    return NextResponse.json({ error: 'データ取得エラー' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyName, name, email, content } = body;

    const fullMessage = companyName
      ? `【会社名】${companyName}\n\n${content || ''}`
      : content || '';

    const newInquiry = await prisma.inquiry.create({
      data: {
        name: name || '匿名',
        email: email || '',
        message: fullMessage,
        status: '未対応',
      },
    });

    try {
      await prisma.announcement.create({
        data: {
          title: `【お問い合わせ】${name || '匿名'}様より新しいメッセージが届きました`,
          category: '重要',
          content: `差出人: ${name || '匿名'} (${email || 'メールアドレスなし'})\n\n本文:\n${fullMessage}`,
        },
      });
    } catch (noticeErr) {
      console.warn('お知らせ自動生成エラー:', noticeErr);
    }

    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error) {
    console.error('POST Inquiry Error:', error);
    return NextResponse.json({ error: '送信失敗' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // 1. お問い合わせ設定（文面など）の更新
    if (body.isSettings) {
      const updatedSettings = await prisma.topSetting.upsert({
        where: { id: 'inquiry_settings' },
        update: { heroSubtitle: JSON.stringify(body.settingsData) },
        create: {
          id: 'inquiry_settings',
          heroSubtitle: JSON.stringify(body.settingsData),
        },
      });
      return NextResponse.json(updatedSettings);
    }

    // 2. 相手からの返信の手動記録
    if (body.isUserReply && body.userReplyText) {
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: body.id },
      });

      const currentMessage = existingInquiry?.message || '';
      const updatedMessage = `${currentMessage}\n\n---USER_REPLY---\n${body.userReplyText}`;

      const updatedInquiry = await prisma.inquiry.update({
        where: { id: body.id },
        data: {
          message: updatedMessage,
          status: '未対応',
        },
      });

      return NextResponse.json(updatedInquiry);
    }

    // 3. 管理者からのメール返信送信 ＆ 履歴保存
    if (body.replyText && body.email) {
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: body.id },
      });

      const currentMessage = existingInquiry?.message || '';
      const updatedMessage = `${currentMessage}\n\n---ADMIN_REPLY---\n${body.replyText}`;

      // ★ データベース（Settingテーブル）から最新の認証情報を取得
      let smtpUser = process.env.SMTP_USER || '';
      let smtpPass = process.env.SMTP_PASS || '';
      let contactEmail = smtpUser;

      try {
        const siteSetting = await prisma.setting.findFirst();
        if (siteSetting) {
          if (siteSetting.smtpUser) smtpUser = siteSetting.smtpUser;
          if (siteSetting.smtpPass) smtpPass = siteSetting.smtpPass;
          if (siteSetting.contactEmail) contactEmail = siteSetting.contactEmail;
        }
      } catch (e) {
        console.warn('Settingテーブル取得スキップ:', e);
      }

      // 不要な空白やダブルクォーテーションを除去
      smtpPass = (smtpPass || '').replace(/^["']|["']$/g, '').trim();
      smtpUser = (smtpUser || '').trim();

      if (!smtpUser || !smtpPass) {
        return NextResponse.json(
          { error: '基本設定で「送信用メールアドレス」と「Googleアプリパスワード」が設定されていません。' },
          { status: 400 }
        );
      }

      // Nodemailer による Gmail 送信
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"BeSmile 事務局" <${smtpUser}>`,
          replyTo: contactEmail || smtpUser,
          to: body.email,
          subject: `【BeSmile】お問い合わせへのご返信`,
          text: body.replyText,
        });
      } catch (mailError: any) {
        console.error('[MAIL ERROR] 実メール送信失敗:', mailError);
        return NextResponse.json(
          { error: `メール送信エラー: ${mailError.message || mailError}` },
          { status: 500 }
        );
      }

      // 送信成功時のみ DB 更新
      const updatedInquiry = await prisma.inquiry.update({
        where: { id: body.id },
        data: {
          message: updatedMessage,
          status: '対応済み',
        },
      });

      return NextResponse.json(updatedInquiry);
    }

    // 4. ステータス変更のみ
    const updatedInquiry = await prisma.inquiry.update({
      where: { id: body.id },
      data: { status: body.status },
    });

    return NextResponse.json(updatedInquiry);
  } catch (error: any) {
    console.error('PUT Inquiry Error:', error);
    return NextResponse.json({ error: error.message || '更新失敗' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'IDが必要です' }, { status: 400 });
  }

  try {
    await prisma.inquiry.delete({
      where: { id },
    });
    return NextResponse.json({ message: '削除完了' });
  } catch (error) {
    console.error('DELETE Inquiry Error:', error);
    return NextResponse.json({ error: '削除失敗' }, { status: 500 });
  }
}