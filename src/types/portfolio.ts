import { Timestamp } from "firebase/firestore";

export interface ProfileData {
  name: string;
  tagline: string;
  bio: string;
  imageUrl: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface FileData {
  id: string;
  fileName: string;
  fileType: string;
  downloadURL: string;
  categoryId: string;
  uploadedAt: Timestamp | Date;
  organization?: string;
}

export interface TemplateData {
  id: string;
  title: string;
  description: string;
  fileType: string;
  downloadURL: string;
  price?: string;
  tags?: string[];
  uploadedAt: Timestamp | Date;
}

export interface LectureRequest {
  id?: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt?: Timestamp | Date;
}

export interface IncomeData {
  id: string;
  incomeAmount: number;
  organization?: string;
  date: Timestamp | Date;
}

export interface MetricData {
  totalFiles: number;
  totalOrganizations: number;
  totalIncome: number;
  categories: {
    [key: string]: number;
  };
}

export interface GrowthData {
  year: number;
  lectures: number;
  income: number;
} 