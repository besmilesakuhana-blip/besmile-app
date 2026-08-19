import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const revalidate = 60;

// GET: アカウント一覧の取得（初期データがない場合はサンプルアカウントを自動作成）
export async function GET() {
  try {
    let users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const defaultUser = await prisma.adminUser.create({
        data: {
          name: '管理者ユーザー',
          email: 'admin@besmile.example.com',
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
      users = [defaultUser];
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: 新規アカウント作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '名前、メールアドレス、パスワードは必須です' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.adminUser.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json(
      { error: 'アカウントの作成に失敗しました。メールアドレスが重複している可能性があります。' },
      { status: 500 }
    );
  }
}

// PUT: アカウント更新・編集
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, password } = body;

    if (!id || !name || !email) {
      return NextResponse.json(
        { error: 'ID、名前、メールアドレスは必須です' },
        { status: 400 }
      );
    }

    const updateData: { name: string; email: string; password?: string } = {
      name,
      email,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update account:', error);
    return NextResponse.json(
      { error: 'アカウントの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: アカウント削除
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

    await prisma.adminUser.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'アカウントを削除しました' });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json(
      { error: '削除に失敗しました' },
      { status: 500 }
    );
  }
}