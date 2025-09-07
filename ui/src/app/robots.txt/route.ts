import { NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const siteUrl = `${protocol}://${host}`

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
