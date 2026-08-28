import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const APP_NAME = 'AfroConnect'
const APP_DESCRIPTION = 'Building Bridges. Creating Futures. - Global networking platform connecting worldwide investors, companies, and professionals with African opportunities'

export const metadata: Metadata = {
  title: {
    default: 'AfroConnect - Connecting Africa to Opportunity',
    template: '%s | AfroConnect'
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    'African entrepreneurs',
    'global investors',
    'African startups',
    'international investment',
    'African opportunities',
    'cross-border business',
    'African talent',
    'global networking',
    'African tech',
    'venture capital Africa',
    'invest in Africa',
    'African market access',
    'diaspora network',
    'international partnerships'
  ],
  authors: [{ name: 'AfroConnect' }],
  creator: 'AfroConnect',
  publisher: 'AfroConnect',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3500'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    creator: '@afroconnect',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#008000' },
    { media: '(prefers-color-scheme: dark)', color: '#001F3F' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
            },
            success: {
              iconTheme: {
                primary: '#008000',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
