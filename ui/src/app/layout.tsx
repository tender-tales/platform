import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/auth/auth-provider'
import { getServerAuthSession } from '@/lib/auth'

const siteUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'Tender Tales - Satellite Change Detection Platform',
  description: 'Visualizing environmental change through Google Earth Engine satellite data. Detect and monitor changes in forest cover, urban development, and land use with AI-powered analysis.',
  keywords: 'satellite imagery, environmental monitoring, Google Earth Engine, AI, conservation, ocean health, change detection',
  robots: 'index, follow',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Tender Tales - Satellite Change Detection Platform',
    description: 'Visualizing environmental change through Google Earth Engine satellite data. Detect and monitor changes in forest cover, urban development, and land use with AI-powered analysis.',
    url: siteUrl,
    siteName: 'Tender Tales',
    images: [
      {
        url: '/tender-tales-logo.png',
        width: 1200,
        height: 630,
        alt: 'Tender Tales Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tender Tales - Satellite Change Detection Platform',
    description: 'Visualizing environmental change through Google Earth Engine satellite data. Detect and monitor changes in forest cover, urban development, and land use with AI-powered analysis.',
    images: ['/tender-tales-logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerAuthSession()

  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
