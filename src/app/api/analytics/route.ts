import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_CDspTW9QAtY6@ep-mute-mouse-ayaa8iod-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true",
    },
  },
});

// ★ POST: アクセスログの記録
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path } = body;

    const ageGroups = ['20代', '30代', '40代', 'その他'];
    const randomAge = ageGroups[Math.floor(Math.random() * ageGroups.length)];

    await prisma.accessLog.create({
      data: {
        path: path || '/',
        ageGroup: randomAge,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics POST Error:', error);
    return NextResponse.json({ success: true }); // エラー時も落ちないようにレスポンスを返す
  }
}

// ★ GET: 集計データの取得（全件取得をやめて DB 側で集計）
export async function GET() {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    // 1. 今週のログを必要な日付フィールドのみ取得
    const logsThisWeek = await prisma.accessLog.findMany({
      where: {
        createdAt: { gte: startOfWeek },
      },
      select: {
        createdAt: true,
      },
    });

    const dayCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };
    logsThisWeek.forEach((log) => {
      const day = new Date(log.createdAt).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const lineData = [
      { day: '月', pv: dayCounts[1] || 0 },
      { day: '火', pv: dayCounts[2] || 0 },
      { day: '水', pv: dayCounts[3] || 0 },
      { day: '木', pv: dayCounts[4] || 0 },
      { day: '金', pv: dayCounts[5] || 0 },
      { day: '土', pv: dayCounts[6] || 0 },
      { day: '日', pv: dayCounts[0] || 0 },
    ];

    // 2. 全件ログの代わりに総件数（count）を取得
    const totalPV = await prisma.accessLog.count();
    const totalCount = totalPV || 1;

    // 3. 年代別集計を DB 側の groupBy で実行（全件取得回避）
    const ageGroupCounts = await prisma.accessLog.groupBy({
      by: ['ageGroup'],
      _count: {
        _all: true,
      },
    });

    const ageCounts: { [key: string]: number } = {
      '20代': 0,
      '30代': 0,
      '40代': 0,
      'その他': 0,
    };

    ageGroupCounts.forEach((group) => {
      const key = group.ageGroup || 'その他';
      if (ageCounts[key] !== undefined) {
        ageCounts[key] += group._count._all;
      } else {
        ageCounts['その他'] += group._count._all;
      }
    });

    const ageData = [
      { name: '20代', value: Math.round((ageCounts['20代'] / totalCount) * 100), color: '#93C5FD' },
      { name: '30代', value: Math.round((ageCounts['30代'] / totalCount) * 100), color: '#C4B5FD' },
      { name: '40代', value: Math.round((ageCounts['40代'] / totalCount) * 100), color: '#A7F3D0' },
      { name: 'その他', value: Math.round((ageCounts['その他'] / totalCount) * 100), color: '#FDE68A' },
    ];

    return NextResponse.json({ lineData, ageData, totalPV });
  } catch (error) {
    console.error('Analytics GET Error:', error);
    return NextResponse.json({ error: 'データ取得エラー' }, { status: 500 });
  }
}