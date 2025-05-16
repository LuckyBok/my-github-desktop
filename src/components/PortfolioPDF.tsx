'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image, Font } from '@react-pdf/renderer';
import { ProfileData, MetricData, GrowthData, TemplateData } from '@/types/portfolio';

// Register fonts for PDF
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2', fontWeight: 700 }
  ]
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: 30,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#4f46e5',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 10,
    marginBottom: 3,
    color: '#4b5563',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statBox: {
    width: '30%',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  statTitle: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  growthContainer: {
    marginBottom: 20,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
  },
  growthRow: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottom: '1px solid #e5e7eb',
  },
  growthYear: {
    width: '30%',
    fontSize: 12,
    fontWeight: 'bold',
  },
  growthData: {
    width: '35%',
    fontSize: 12,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryName: {
    width: '70%',
    fontSize: 12,
  },
  categoryCount: {
    width: '30%',
    fontSize: 12,
    textAlign: 'right',
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  templateItem: {
    width: '48%',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  templateDesc: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
  },
});

// Create PDF Document component
const PortfolioPDF = ({ 
  profile, 
  metrics, 
  growthData, 
  templates 
}: { 
  profile: ProfileData; 
  metrics: MetricData; 
  growthData: GrowthData[];
  templates: TemplateData[];
}) => {
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get top 3 categories
  const topCategories = Object.entries(metrics.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with profile information */}
        <View style={styles.header}>
          {profile.imageUrl && (
            <Image src={profile.imageUrl} style={styles.profileImage} />
          )}
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.name || 'Instructor'}</Text>
            <Text style={styles.tagline}>{profile.tagline || 'Professional Instructor'}</Text>
            
            {profile.email && (
              <Text style={styles.contactText}>Email: {profile.email}</Text>
            )}
            
            {profile.phone && (
              <Text style={styles.contactText}>Phone: {profile.phone}</Text>
            )}
            
            {profile.website && (
              <Text style={styles.contactText}>Website: {profile.website}</Text>
            )}
          </View>
        </View>
        
        {/* Key Statistics */}
        <Text style={styles.sectionTitle}>Key Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>Total Files</Text>
            <Text style={styles.statValue}>{metrics.totalFiles}</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>Organizations</Text>
            <Text style={styles.statValue}>{metrics.totalOrganizations}</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>Total Revenue</Text>
            <Text style={styles.statValue}>{formatCurrency(metrics.totalIncome)}</Text>
          </View>
        </View>
        
        {/* Top Categories */}
        <Text style={styles.sectionTitle}>Top Categories</Text>
        <View style={styles.categoriesContainer}>
          {topCategories.map(([category, count], index) => (
            <View key={index} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{category}</Text>
              <Text style={styles.categoryCount}>{count} files</Text>
            </View>
          ))}
        </View>
        
        {/* Growth Timeline */}
        <Text style={styles.sectionTitle}>Growth Timeline</Text>
        <View style={styles.growthContainer}>
          <View style={[styles.growthRow, { fontWeight: 'bold' }]}>
            <Text style={styles.growthYear}>Year</Text>
            <Text style={styles.growthData}>Lectures</Text>
            <Text style={styles.growthData}>Income</Text>
          </View>
          
          {growthData.map((data, index) => (
            <View key={index} style={styles.growthRow}>
              <Text style={styles.growthYear}>{data.year}</Text>
              <Text style={styles.growthData}>{data.lectures}</Text>
              <Text style={styles.growthData}>{formatCurrency(data.income)}</Text>
            </View>
          ))}
        </View>
        
        {/* Templates Showcase */}
        {templates.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Templates Showcase</Text>
            <View style={styles.templateGrid}>
              {templates.slice(0, 4).map((template, index) => (
                <View key={index} style={styles.templateItem}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateDesc}>{template.description}</Text>
                  <Text style={styles.templateDesc}>
                    {template.price === 'Free' ? 'Free' : `Price: ${template.price}`}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
        
        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString()} • {profile.name || 'Instructor'} Portfolio
        </Text>
      </Page>
    </Document>
  );
};

// Button component that generates and triggers the download
const DownloadPortfolioPDF = ({ 
  profile, 
  metrics, 
  growthData, 
  templates 
}: { 
  profile: ProfileData; 
  metrics: MetricData; 
  growthData: GrowthData[];
  templates: TemplateData[];
}) => {
  // Create a filename based on the instructor's name
  const filename = `${profile?.name || 'Instructor'}_Portfolio_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
  
  return (
    <PDFDownloadLink 
      document={
        <PortfolioPDF 
          profile={profile} 
          metrics={metrics} 
          growthData={growthData}
          templates={templates}
        />
      } 
      fileName={filename}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
    >
      {({ blob, url, loading, error }) => 
        loading ? 'Generating PDF...' : 'Download Portfolio as PDF'
      }
    </PDFDownloadLink>
  );
};

export default DownloadPortfolioPDF; 