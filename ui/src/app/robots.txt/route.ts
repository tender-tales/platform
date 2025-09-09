import { NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const siteUrl = `${protocol}://${host}`

  const robotsTxt = `# Robots.txt for ${host}
# Generated dynamically with best practices

# Allow all crawlers access to public content
User-agent: *
Allow: /

# Block access to private/admin areas (if they exist)
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
Disallow: /.well-known/

# Block common bot traps and non-content paths
Disallow: /*?*
Disallow: /search?*

# Crawl delay for respectful crawling (optional)
Crawl-delay: 1

# Specific rules for common bots
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Block aggressive crawlers that don't respect standards
User-agent: SemrushBot
Disallow: /

User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml

# Additional metadata
# Host: ${host}
# Contact: For crawling questions, please contact via ${siteUrl}/contact`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}
