'use client'

import { useState, useEffect } from 'react'
import PDFDownloader from '@/components/PDFDownloader'

export default function ReportPage() {
  const [isClient, setIsClient] = useState(false)
  const [reportDate, setReportDate] = useState('')
  
  useEffect(() => {
    // Mark that we're on the client
    setIsClient(true)
    
    // Set dynamic values only after hydration
    setReportDate(new Date().toLocaleDateString())
  }, [])
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <p className="mb-4">Click the button below to download a sample PDF report.</p>
      {isClient && <PDFDownloader />}
      
      {reportDate && (
        <p className="text-sm text-gray-500 mt-4">Report generated on: {reportDate}</p>
      )}
    </div>
  )
} 