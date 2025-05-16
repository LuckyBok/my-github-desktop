import { Timestamp } from 'firebase/firestore';

export interface SeedTemplate {
  id: string;
  title: string;
  description: string;
  fileType: string;
  downloadURL: string;
  price?: string;
  tags?: string[];
  uploadedAt: Timestamp;
}

export const seedTemplates: SeedTemplate[] = [
  {
    id: 'template1',
    title: 'Lecture Planner Template',
    description: 'A comprehensive template to plan your lectures with objectives, materials, and time allocation.',
    fileType: 'application/pdf',
    downloadURL: 'https://example.com/templates/lecture-planner.pdf',
    price: 'Free',
    tags: ['Teaching', 'Planning', 'Productivity'],
    uploadedAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  },
  {
    id: 'template2',
    title: 'Course Evaluation Form',
    description: 'Gather feedback from your students with this comprehensive evaluation template.',
    fileType: 'application/docx',
    downloadURL: 'https://example.com/templates/evaluation-form.docx',
    price: '$5',
    tags: ['Feedback', 'Assessment', 'Teaching'],
    uploadedAt: Timestamp.fromDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
  },
  {
    id: 'template3',
    title: 'Teaching Resources Bundle',
    description: 'A complete set of templates and resources for effective teaching and course management.',
    fileType: 'application/zip',
    downloadURL: 'https://example.com/templates/teaching-bundle.zip',
    price: '$19',
    tags: ['Bundle', 'Teaching', 'Resources'],
    uploadedAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  },
  {
    id: 'template4',
    title: 'Income Tracker Spreadsheet',
    description: 'Track your teaching income and expenses with this easy-to-use Excel template.',
    fileType: 'application/xlsx',
    downloadURL: 'https://example.com/templates/income-tracker.xlsx',
    price: '$8',
    tags: ['Finance', 'Tracking', 'Spreadsheet'],
    uploadedAt: Timestamp.fromDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000))
  },
  {
    id: 'template5',
    title: 'Student Progress Report',
    description: 'Generate professional student progress reports for parents or administrators.',
    fileType: 'application/pdf',
    downloadURL: 'https://example.com/templates/progress-report.pdf',
    price: 'Free',
    tags: ['Reporting', 'Assessment', 'Communication'],
    uploadedAt: Timestamp.fromDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
  }
]; 