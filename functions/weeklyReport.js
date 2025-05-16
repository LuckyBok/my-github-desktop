const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { PDFDocument, rgb } = require('pdf-lib');
const { format, startOfWeek, endOfWeek } = require('date-fns');

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Email configuration - store these in environment variables in production
const EMAIL_USER = functions.config().email?.user || 'your-email@gmail.com';
const EMAIL_PASS = functions.config().email?.pass || 'your-app-password';
const ADMIN_EMAIL = functions.config().admin?.email || 'admin@example.com';

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

/**
 * Generate the weekly report PDF
 * @param {Object} data Report data including new files, income, and top organizations
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateReportPDF(data) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  
  // Page dimensions
  const { width, height } = page.getSize();
  
  // Define text options
  const titleFont = 16;
  const headingFont = 14;
  const normalFont = 12;
  const smallFont = 10;
  const margin = 50;
  
  // Add title and date range
  page.drawText('Weekly Admin Report', {
    x: margin,
    y: height - margin,
    size: titleFont
  });
  
  page.drawText(`Report Period: ${data.dateRange}`, {
    x: margin,
    y: height - margin - 25,
    size: normalFont
  });
  
  // Add new files section
  page.drawText('New Files Uploaded', {
    x: margin,
    y: height - margin - 60,
    size: headingFont
  });
  
  page.drawText(`Total new files: ${data.newFiles.length}`, {
    x: margin,
    y: height - margin - 85,
    size: normalFont
  });
  
  // List new files
  let yPos = height - margin - 110;
  data.newFiles.forEach((file, index) => {
    if (yPos < 100) {
      // Add new page if we're running out of space
      const newPage = pdfDoc.addPage([612, 792]);
      yPos = height - margin;
    }
    
    page.drawText(`${index + 1}. ${file.fileName} (${file.organization || 'No organization'})`, {
      x: margin + 10,
      y: yPos,
      size: smallFont
    });
    
    yPos -= 20;
  });
  
  // Add income section
  yPos -= 20;
  
  page.drawText('Weekly Income', {
    x: margin,
    y: yPos,
    size: headingFont
  });
  
  yPos -= 25;
  
  page.drawText(`Total income this week: $${data.weeklyIncome.toLocaleString()}`, {
    x: margin,
    y: yPos,
    size: normalFont
  });
  
  // Add top organizations section
  yPos -= 40;
  
  page.drawText('Top Organizations', {
    x: margin,
    y: yPos,
    size: headingFont
  });
  
  yPos -= 25;
  
  // List top organizations
  data.topOrganizations.forEach((org, index) => {
    page.drawText(`${index + 1}. ${org.name}: ${org.count} files`, {
      x: margin + 10,
      y: yPos,
      size: smallFont
    });
    
    yPos -= 20;
  });
  
  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Cloud function that runs every Sunday at 1:00 AM
exports.sendWeeklyReport = functions.pubsub
  .schedule('0 1 * * 0') // Runs at 1:00 AM every Sunday
  .timeZone('America/New_York') // Adjust to your timezone
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      
      // Define the date range for this week (last 7 days)
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday as start of week
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      
      // Format date range for display
      const dateRange = `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      
      // Query for new files uploaded this week
      const filesSnapshot = await db
        .collection('files')
        .where('uploadedAt', '>=', admin.firestore.Timestamp.fromDate(weekStart))
        .where('uploadedAt', '<=', admin.firestore.Timestamp.fromDate(weekEnd))
        .get();
      
      const newFiles = filesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fileName: doc.data().fileName || 'Unnamed File',
        organization: doc.data().organization || 'Unspecified'
      }));
      
      // Query for income this week
      const incomeSnapshot = await db
        .collection('income')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(weekStart))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(weekEnd))
        .get();
      
      const weeklyIncome = incomeSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().incomeAmount || 0);
      }, 0);
      
      // Calculate top organizations
      const orgCounts = {};
      
      // Count organizations from files collection
      const allFilesSnapshot = await db.collection('files').get();
      allFilesSnapshot.docs.forEach(doc => {
        const org = doc.data().organization || 'Unspecified';
        orgCounts[org] = (orgCounts[org] || 0) + 1;
      });
      
      // Convert to array and sort
      const topOrganizations = Object.entries(orgCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Get top 3
      
      // Generate the PDF report
      const reportData = {
        dateRange,
        newFiles,
        weeklyIncome,
        topOrganizations
      };
      
      const pdfBuffer = await generateReportPDF(reportData);
      
      // Send the email
      const mailOptions = {
        from: EMAIL_USER,
        to: ADMIN_EMAIL,
        subject: `Weekly Admin Report: ${dateRange}`,
        text: 'Please find attached the weekly admin report.',
        attachments: [
          {
            filename: `weekly-report-${format(now, 'yyyy-MM-dd')}.pdf`,
            content: pdfBuffer
          }
        ]
      };
      
      await transporter.sendMail(mailOptions);
      
      console.log('Weekly report sent successfully');
      return null;
    } catch (error) {
      console.error('Error sending weekly report:', error);
      return null;
    }
  });

// Callable function for manual email sending
exports.sendWeeklyReportManually = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to send reports.');
  }

  // In a real app, you would check against admin UID or custom claims
  // if (!context.auth.token.admin) {
  //   throw new functions.https.HttpsError('permission-denied', 'You must be an admin to send reports.');
  // }

  try {
    const { adminEmail, reportData } = data;
    
    if (!adminEmail || !reportData) {
      throw new functions.https.HttpsError('invalid-argument', 'Email address and report data are required.');
    }
    
    const pdfBuffer = await generateReportPDF(reportData);
    
    // Send the email
    const mailOptions = {
      from: EMAIL_USER,
      to: adminEmail,
      subject: `Weekly Admin Report: ${reportData.dateRange}`,
      text: 'Please find attached the requested weekly admin report.',
      attachments: [
        {
          filename: `weekly-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          content: pdfBuffer
        }
      ]
    };
    
    await transporter.sendMail(mailOptions);
    
    return { success: true, message: 'Report sent successfully' };
  } catch (error) {
    console.error('Error sending manual report:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send report email.');
  }
}); 