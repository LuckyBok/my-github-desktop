'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Timestamp } from "firebase/firestore";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { redirect } from 'next/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "File Management System",
  description: "Professional file management system for IT instructors",
};

interface PDFProps {
  stats: {
    totalFiles: number;
    totalCategories: number;
    totalOrganizations: number;
    totalIncome: number;
  };
  profile: {
    name?: string;
    tagline?: string;
    imageUrl?: string;
    email?: string;
    phone?: string;
    website?: string;
  } | null;
  modules: Array<{
    name: string;
    status: boolean;
    description: string;
  }>;
  generatedDate?: string;
}

const ProjectSummaryReport = ({
  stats,
  profile,
  modules,
  generatedDate,
}: {
  stats: Stats;
  profile: Profile | null; // Allow for null during loading
  modules: Module[];
  generatedDate?: string; // For hydration safety
}) => {
  // Component implementation
  
  // Use isClient check for any client-side only rendering
  const [isClient, setIsClient] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');
  
  useEffect(() => {
    setIsClient(true);
    setFormattedDate(new Date().toLocaleDateString());
  }, []);
  
  // Return component JSX
  return (
    <div>
      {/* Content using isClient check for dynamic values */}
      <p>Generated: {generatedDate || ''}</p>
    </div>
  );
};

export async function generateMetadata(): Promise<Metadata> {
  // You could fetch data here if needed
  return {
    title: "File Management System",
    description: "Professional file management system for IT instructors",
    openGraph: {
      title: "File Management System",
      description: "Professional file management system for IT instructors",
      images: ['/og-image.jpg']
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Check auth after hydration
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  // Prevent render until client-side
  if (!isClient) return null;
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200`}
      >
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
        {isClient && <ClientOnlyComponent />}
      </body>
    </html>
  );
}

// Server component
export function ProtectedServerPage() {
  const router = useRouter();
  
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Check auth after hydration
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  // Prevent render until client-side
  if (!isClient) return null;
  
  return <YourProtectedContent />;
}
