import { NextResponse } from 'next/server'

export function GET() {
  const siteUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const robotsTxt = `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
