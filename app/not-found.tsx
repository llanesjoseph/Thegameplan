import Link from 'next/link'

export default function NotFound() {
 return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
   <div className="text-center">
    <h1 className="text-6xl text-white mb-4">404</h1>
    <h2 className="text-2xl text-slate-300 mb-8">Page Not Found</h2>
    <p className="text-slate-400 mb-8">
     The page you're looking for doesn't exist or has been moved.
    </p>
    <Link
     href="/"
     className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
     Go Home
    </Link>
   </div>
  </div>
 )
}