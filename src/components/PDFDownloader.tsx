'use client';

import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 20,
  },
  section: {
    marginBottom: 10,
  },
});

// The actual PDF document component
const MyDocument = ({ title }: { title: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text>{title}</Text>
      </View>
    </Page>
  </Document>
);

// Exported PDF download button component
export default function PDFDownloader() {
  // Create a state to track client-side hydration
  const [isClient, setIsClient] = useState(false);
  
  // This effect runs only on the client after hydration is complete
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div className="mt-4">
      <h1>PDF Download Section</h1>
      
      {/* Only render PDF components when on the client */}
      {isClient ? (
        <PDFDownloadLink
          document={<MyDocument title="My Custom PDF from React" />}
          fileName="report.pdf"
        >
          {({ loading }) =>
            loading ? 'Generating PDF...' : '📄 Download Report'
          }
        </PDFDownloadLink>
      ) : (
        // Show a placeholder during SSR and initial hydration
        <button disabled className="opacity-50">
          Download PDF
        </button>
      )}
    </div>
  );
} 