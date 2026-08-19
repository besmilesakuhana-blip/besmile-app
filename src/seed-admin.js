// seed-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const rawPassword = 'admin1234';

  // パスワードをハッシュ化（暗号化）
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // 既存の管理者がいれば更新、いなければ新規作成
  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
    },
    create: {
      email,
      password: hashedPassword,
      name: '管理者',
    },
  });

  console.log('-----------------------------------');
  console.log('✅ 管理者アカウントが作成/更新されました！');
  console.log(`📧 メールアドレス: ${admin.email}`);
  console.log(`🔑 パスワード: ${rawPassword}`);
  console.log('-----------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ 登録エラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });