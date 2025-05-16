This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Firebase Authentication Setup

This project uses Firebase Authentication for the admin panel. Follow these steps to set it up:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication in the Firebase console
3. Create a `.env.local` file in the root of the project with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

4. Update the admin email addresses in `src/contexts/AuthContext.tsx` to include your admin email(s)
5. Create users in Firebase Authentication that match your admin emails

## Google Sheets Integration

This project includes integration with Google Sheets to log file uploads. Follow these steps to set it up:

1. Create a new Google Sheet with the following columns:
   - Timestamp
   - File Name
   - Category
   - File Size
   - Organization

2. Set up a Google Apps Script webhook:
   - From your Google Sheet, go to Extensions > Apps Script
   - Create a new script file and paste the code from `src/lib/google-apps-script.txt`
   - Replace 'YOUR_GOOGLE_SHEET_ID' with your actual spreadsheet ID
   - Deploy the script as a web app (Deploy > New deployment)
   - Set execution to run as you and allow access to "Anyone" or "Anyone with Google account"
   - Copy the deployment URL

3. Add the webhook URL to your environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... other Firebase variables
NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL=your-google-apps-script-webhook-url
```

Now when files are uploaded through the admin dashboard, they will be automatically logged to your Google Sheet.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
