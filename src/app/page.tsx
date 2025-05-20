import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          📁 File Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Securely manage, organize and share your files with ease.
        </p>
        <Link 
          href="/test-upload" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded-md transition-colors"
        >
          Open File Uploader
        </Link>
      </div>
    </div>
  );
}
