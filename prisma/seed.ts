import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 既存データを削除中...');

  // 1. 既存データの削除
  await prisma.work.deleteMany();
  await prisma.creator.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany();

  // 2. パスワードのハッシュ化（"password123"）
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. 管理者ユーザーの作成
  console.log('👤 管理者ユーザーを作成中...');

  await prisma.adminUser.create({
    data: {
      email: 'create.besmile@gmail.com',
      password: hashedPassword,
      name: 'BeSmile 管理者',
    },
  });

  await prisma.adminUser.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: '管理者',
    },
  });

  await prisma.user.create({
    data: {
      email: 'create.besmile@gmail.com',
      password: hashedPassword,
      name: 'BeSmile 管理者',
      role: '管理者',
    },
  });

  // 4. テスト用クリエイターの作成
  console.log('🎨 クリエイターデータを作成中...');
  const creator1 = await prisma.creator.create({
    data: {
      name: '山田 太郎',
      role: 'Webデザイナー / UI・UX',
      bio: 'Webデザインとブランディングを中心に活動しています。',
      avatarUrl: '/icons/creators.png',
    },
  });

  const creator2 = await prisma.creator.create({
    data: {
      name: '佐藤 花子',
      role: '映像ディレクター',
      bio: 'プロモーション動画や3Dアニメーションを制作しています。',
      avatarUrl: '/icons/creatorhukusuu.png',
    },
  });

  // 5. テスト用作品の作成
  await prisma.work.createMany({
    data: [
      {
        title: 'コーポレートサイト リニューアル',
        category: 'Webデザイン',
        description: '先進的な印象を与えるモダンなコーポレートサイトの制作。',
        imageUrl: '/photos/work1.jpg',
        creatorId: creator1.id,
      },
      {
        title: '新商品プロモーション動画 2026',
        category: '映像',
        description: '新商品の魅力を伝える15秒のPV動画。',
        imageUrl: '/photos/work2.jpg',
        creatorId: creator2.id,
      },
    ],
  });

  // 6. テスト用お知らせの作成
  await prisma.announcement.createMany({
    data: [
      {
        title: 'BeSmile Webサイトをリニューアルしました',
        category: 'お知らせ',
        status: '公開済み',
        content: 'いつもご利用いただきありがとうございます。Webサイトを全面リニューアルいたしました。',
      },
      {
        title: '新規クリエイターが参加しました！',
        category: '更新情報',
        status: '公開済み',
        content: '新たに優秀なクリエイターがチームに加わりました。作品ページからぜひご覧ください。',
      },
    ],
  });

  console.log('🌱 シードデータの初期化が完了しました！');
}

main()
  .catch((e) => {
    console.error('❌ シード処理エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });