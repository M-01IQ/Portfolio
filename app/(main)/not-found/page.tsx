import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-100 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">الصفحة غير موجودة</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        العنوان الذي تحاول الوصول إليه غير موجود أو تم تحريكه.
      </p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        العودة للصفحة الرئيسية
      </Link>
    </div>
  );
}
