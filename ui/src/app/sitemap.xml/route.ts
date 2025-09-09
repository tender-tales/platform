import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import {
  discoverPages,
  generateSitemapXML,
  getCachedSitemap,
  setCachedSitemap
} from '@/lib/sitemap-utils'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const siteUrl = `${protocol}://${host}`

  // Check cache first
  const cachedSitemap = getCachedSitemap()
  if (cachedSitemap) {
    return new NextResponse(cachedSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      },
    })
  }

  try {
    // Get the app directory path
    const appDir = path.join(process.cwd(), 'src', 'app')

    // Discover all pages dynamically
    const pages = await discoverPages(appDir)

    // Generate sitemap XML
    const sitemap = generateSitemapXML(siteUrl, pages)

    // Cache the result
    setCachedSitemap(sitemap)

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)

    // Fallback to basic sitemap
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

    return new NextResponse(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  }
}
