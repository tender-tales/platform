import type { Metadata } from 'next'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  title: 'Tender Tales',
  description: 'Our mission is to help protect vulnerable ecosystems and preserve the rich fabric of biodiversity on which all life depends.',
  keywords: 'environmental conservation, biodiversity protection, ecosystem monitoring, wildlife conservation, marine conservation, forest protection, climate change, environmental science, sustainability, nature preservation, ecological research, environmental data, remote sensing, habitat protection, species conservation, environmental impact, conservation technology, green technology, earth observation, environmental awareness, conservation efforts, endangered species, natural resources, environmental stewardship, conservation biology, ecological diversity, environmental protection, conservation planning, sustainable development, environmental solutions',
  robots: 'index, follow',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'Tender Tales',
    description: 'Our mission is to help protect vulnerable ecosystems and preserve the rich fabric of biodiversity on which all life depends.',
    url: siteUrl,
    siteName: 'Tender Tales',
    images: [
      {
        url: '/tender-tales-logo.png',
        width: 1200,
        height: 630,
        alt: 'Tender Tales',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tender Tales',
    description: 'Our mission is to help protect vulnerable ecosystems and preserve the rich fabric of biodiversity on which all life depends.',
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
