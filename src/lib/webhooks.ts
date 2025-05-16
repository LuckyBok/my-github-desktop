/**
 * Utility functions for external API integrations
 */

/**
 * Send file upload data to Google Sheets via a webhook
 * @param fileData The file data to log
 * @returns Promise that resolves when the webhook request is complete
 */
export async function logFileUploadToGoogleSheets(fileData: {
  fileName: string;
  categoryId: string;
  fileSize: number;
  uploadedAt: string;
  organization?: string;
}): Promise<Response> {
  // This should be stored in an environment variable in a real app
  const GOOGLE_SHEETS_WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
  
  if (!GOOGLE_SHEETS_WEBHOOK_URL) {
    throw new Error('Google Sheets webhook URL is not configured');
  }
  
  // Send data to Google Sheets via webhook
  const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: fileData.fileName,
      categoryId: fileData.categoryId,
      fileSize: fileData.fileSize,
      uploadedAt: fileData.uploadedAt,
      organization: fileData.organization || 'Unspecified'
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to log to Google Sheets: ${response.statusText}`);
  }
  
  return response;
} 