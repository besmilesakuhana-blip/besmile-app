import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

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

      try {
        await prisma.announcement.create({
          data: {
            title: `【返信受信】${existingInquiry?.name || 'お客様'}より返信が届きました`,
            category: '重要',
            content: `返信内容:\n${body.userReplyText}`,
          },
        });
      } catch (noticeErr) {
        console.warn('お知らせ自動生成エラー:', noticeErr);
      }

      return NextResponse.json(updatedInquiry);
    }

    if (body.replyText && body.email) {
      const existingInquiry = await prisma.inquiry.findUnique({
        where: { id: body.id },
      });

      const currentMessage = existingInquiry?.message || '';
      const updatedMessage = `${currentMessage}\n\n---ADMIN_REPLY---\n${body.replyText}`;

      let adminEmail = process.env.SMTP_USER || 'admin@example.com';
      try {
        const siteSetting = await prisma.setting.findFirst({
          select: { contactEmail: true },
        });
        if (siteSetting?.contactEmail) {
          adminEmail = siteSetting.contactEmail;
        }
      } catch (e) {
        console.warn('基本設定のメールアドレス取得をスキップしました:', e);
      }

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: `"BeSmile 事務局" <${process.env.SMTP_USER}>`,
            replyTo: adminEmail,
            to: body.email,
            subject: `【BeSmile】お問い合わせへのご返信`,
            text: body.replyText,
          });
        } catch (mailError) {
          console.error('実メール送信エラー（DBログ更新は継続）:', mailError);
        }
      }

      const updatedInquiry = await prisma.inquiry.update({
        where: { id: body.id },
        data: {
          message: updatedMessage,
          status: '対応済み',
        },
      });

      return NextResponse.json(updatedInquiry);
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id: body.id },
      data: { status: body.status },
    });

    return NextResponse.json(updatedInquiry);
  } catch (error) {
    console.error('PUT Inquiry Error:', error);
    return NextResponse.json({ error: '更新失敗' }, { status: 500 });
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