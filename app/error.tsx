'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong!
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Try again
          </button>
          <a
            href="/"
            className="block w-full text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Go to homepage
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="mt-4 text-xs text-gray-500 text-center">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
