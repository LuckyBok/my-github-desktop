export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export const categories: Category[] = [
  { id: "resume", name: "Resume & CV", description: "Professional resumes, CVs, and career documents" },
  { id: "tax", name: "Tax Documents", description: "Tax returns, receipts, and financial records" },
  { id: "teaching", name: "Teaching Materials", description: "Course materials, lesson plans, and educational resources" },
  { id: "contracts", name: "Contracts & Agreements", description: "Client contracts, teaching agreements, and legal documents" },
  { id: "submission", name: "Submission Documents", description: "Lecture plans, activity logs, result reports" },
  { id: "student", name: "Student Management", description: "Attendance, quiz results, participant lists" },
  { id: "automation", name: "Automation Tools", description: "Google Sheets, Apps Script, Zoom CSV, etc." },
  { id: "proposal", name: "Proposals & Estimates", description: "Project proposals, quotations, and service pricing" },
  { id: "sns", name: "SNS & Marketing", description: "Thumbnails, hashtags, scripts, and social posts" },
  { id: "income", name: "Earnings & Settlements", description: "Income statements, deductions, transportation fees" },
  { id: "taxes", name: "Taxes", description: "Income tax, VAT, tax advisor communication" },
  { id: "legal", name: "Legal & Policy", description: "Agreements, licenses, IP, usage rights" },
  { id: "evaluation", name: "Feedback & Evaluation", description: "Satisfaction results, feedback records" },
  { id: "schedule", name: "Schedule Management", description: "Lecture plans, deadlines, calendar entries" },
  { id: "backup", name: "Backup & Recovery", description: "Full zip backups, critical file storage" },
  { id: "clients", name: "Client/Agency History", description: "Communication history, contract terms" },
  { id: "portfolio", name: "Portfolio & Results", description: "Best lectures, reviews, achievement records" },
  { id: "learning", name: "Self-Development", description: "Certificates, completed courses, workshops" },
  { id: "growth", name: "Income Strategy & Tracking", description: "High ROI content tracking, growth ideas" },
  { id: "brand", name: "Brand Management", description: "Profiles, slogans, PR messages" },
  { id: "products", name: "Digital Products / Automation", description: "Paid templates, online lectures, scripts" },
  { id: "time", name: "Time ROI & Efficiency", description: "Time-to-income analysis, automation priorities" },
  { id: "ai", name: "AI/Automation Usage", description: "Prompt logs, usage records, GPT experiments" },
  { id: "legacy", name: "Legacy & IP Management", description: "Handover manuals, resale strategy" },
  { id: "insurance", name: "Insurance Docs", description: "Claims, policy copies, diagnosis results" },
  { id: "realestate", name: "Real Estate & Rental Docs", description: "Contracts, taxes, utility bills" }
]; 