import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/auth/auth-provider'
import { getServerAuthSession } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Tender Tales - Satellite Change Detection Platform',
  description: 'Visualizing environmental change through Google Earth Engine satellite data. Detect and monitor changes in forest cover, urban development, and land use with AI-powered analysis.',
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
