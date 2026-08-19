-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'お知らせ',
    "status" TEXT NOT NULL DEFAULT '公開済み',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '一般',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL DEFAULT 'site_settings',
    "siteTitle" TEXT NOT NULL DEFAULT 'BeSmile',
    "heroTitle" TEXT NOT NULL DEFAULT '笑顔とクリエイティブを届ける',
    "heroSubtitle" TEXT NOT NULL DEFAULT '映像・グラフィック・Web制作のプロフェッショナル集団です。',
    "mainImageUrl" TEXT NOT NULL DEFAULT '/icons/top.png',
    "contactEmail" TEXT NOT NULL DEFAULT 'info@besmile.example.com',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'その他',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '未対応',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '管理者',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopSetting" (
    "id" TEXT NOT NULL DEFAULT 'top_settings',
    "heroTitle" TEXT NOT NULL DEFAULT '笑顔とクリエイティブを届ける',
    "heroSubtitle" TEXT NOT NULL DEFAULT '映像・グラフィック・Web制作のプロフェッショナル集団です。',
    "mainImageUrl" TEXT NOT NULL DEFAULT '/icons/top.png',
    "aboutTitle" TEXT NOT NULL DEFAULT '私たちについて',
    "aboutDescription" TEXT NOT NULL DEFAULT 'お客様の想いをカタチにし、感動と笑顔を生み出すクリエイティブを提供します。',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "headerLogoUrl" TEXT NOT NULL DEFAULT '/icons/top.png',
    "heroImages" TEXT[] DEFAULT ARRAY['/icons/photos.png', '/icons/works.png', '/icons/creators.png', '/icons/header.png']::TEXT[],
    "footerLogoUrl" TEXT NOT NULL DEFAULT '/icons/top.png',
    "footerComment" TEXT NOT NULL DEFAULT 'Be Smileは、クリエイターの魅力を最大限に届けるプラットフォームです。',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
