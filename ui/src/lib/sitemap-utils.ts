import { promises as fs } from 'fs'
import path from 'path'

export interface SitemapUrl {
  loc: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

export interface PageMetadata {
  route: string
  filePath: string
  lastModified: Date
  priority: number
  changefreq: SitemapUrl['changefreq']
}

/**
 * Get file modification time
 */
export async function getFileLastModified(filePath: string): Promise<Date> {
  try {
    const stats = await fs.stat(filePath)
    return stats.mtime
  } catch (error) {
    console.warn(`Could not get modification time for ${filePath}:`, error)
    return new Date()
  }
}

/**
 * Recursively discover all page.tsx files in the app directory
 */
export async function discoverPages(appDir: string): Promise<PageMetadata[]> {
  const pages: PageMetadata[] = []

  async function scanDirectory(dir: string, route = ''): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          // Skip special Next.js directories and private routes
          if (entry.name.startsWith('(') || entry.name.startsWith('_') ||
              entry.name === 'api' || entry.name.includes('.')) {
            continue
          }

          const newRoute = route + '/' + entry.name
          await scanDirectory(fullPath, newRoute)
        } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
          const routePath = route === '' ? '/' : route
          const lastModified = await getFileLastModified(fullPath)

          // Determine priority and change frequency based on route
          const { priority, changefreq } = getRouteMetadata(routePath)

          pages.push({
            route: routePath,
            filePath: fullPath,
            lastModified,
            priority,
            changefreq
          })
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dir}:`, error)
    }
  }

  await scanDirectory(appDir)
  return pages.sort((a, b) => b.priority - a.priority)
}

/**
 * Determine SEO metadata based on route patterns
 */
function getRouteMetadata(route: string): { priority: number; changefreq: SitemapUrl['changefreq'] } {
  // Homepage
  if (route === '/') {
    return { priority: 1.0, changefreq: 'weekly' }
  }

  // Blog routes
  if (route.startsWith('/blog')) {
    if (route === '/blog') {
      return { priority: 0.9, changefreq: 'weekly' }
    }
    return { priority: 0.8, changefreq: 'monthly' }
  }

  // Service pages
  if (route.startsWith('/services')) {
    return { priority: 0.8, changefreq: 'monthly' }
  }

  // Main navigation pages
  if (['/about', '/contact'].includes(route)) {
    return { priority: 0.8, changefreq: 'monthly' }
  }

  // Legal pages
  if (['/privacy', '/terms'].includes(route)) {
    return { priority: 0.3, changefreq: 'yearly' }
  }

  // Default for other pages
  return { priority: 0.6, changefreq: 'monthly' }
}

/**
 * Generate sitemap XML from page metadata
 */
export function generateSitemapXML(siteUrl: string, pages: PageMetadata[]): string {
  const urls = pages.map(page => ({
    loc: `${siteUrl}${page.route}`,
    lastmod: page.lastModified.toISOString(),
    changefreq: page.changefreq,
    priority: page.priority
  }))

  const urlEntries = urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

/**
 * Cache management for better performance
 */
let sitemapCache: { content: string; timestamp: number } | null = null
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export function getCachedSitemap(): string | null {
  if (!sitemapCache) return null

  const now = Date.now()
  if (now - sitemapCache.timestamp > CACHE_DURATION) {
    sitemapCache = null
    return null
  }

  return sitemapCache.content
}

export function setCachedSitemap(content: string): void {
  sitemapCache = {
    content,
    timestamp: Date.now()
  }
}
