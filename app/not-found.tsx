import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-white mb-4 opacity-20">404</h1>
        <div className="relative -mt-20">
          <h2 className="text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 py-3 px-8 rounded-lg font-bold hover:shadow-xl hover:shadow-gold-500/50 transition-all"
            >
              Go Home
            </Link>
            <Link
              href="/explore"
              className="bg-white/10 backdrop-blur-sm text-white py-3 px-8 rounded-lg font-medium hover:bg-white/20 transition-all border border-white/20"
            >
              Explore Network
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
