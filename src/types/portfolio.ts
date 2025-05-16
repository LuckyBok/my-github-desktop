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
  uploadedAt: any;
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
  uploadedAt: any;
}

export interface LectureRequest {
  id?: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt?: any;
}

export interface IncomeData {
  id: string;
  incomeAmount: number;
  organization?: string;
  date: any;
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