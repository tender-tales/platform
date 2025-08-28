import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tender Tales - Satellite Change Detection Platform',
  description: 'Visualizing environmental change through Google Earth Engine satellite data. Detect and monitor changes in forest cover, urban development, and land use with AI-powered analysis.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}