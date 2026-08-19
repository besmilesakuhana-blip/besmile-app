export type Category = 'WEB' | 'VIDEO' | 'DTP' | 'ILLUSTRATION' | 'OTHER';
export type InquiryStatus = 'UNHANDLED' | 'PROCESSING' | 'COMPLETED';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Creator {
  id: string;
  name: string;
  imageUrl: string | null;
  comment: string | null;
  skills: string[];
  category: Category;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  works?: Work[];
}

export interface Work {
  id: string;
  creatorId: string;
  title: string;
  imageUrl: string | null;
  comment: string | null;
  category: Category;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopSiteSetting {
  id: string;
  creatorCount: number;
  webWorkCount: number;
  videoWorkCount: number;
  dtpWorkCount: number;
  illustrationWorkCount: number;
  otherWorkCount: number;
  updatedAt: Date;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  content: string;
  status: InquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteCommonSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}
