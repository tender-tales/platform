/**
 * Build-time sitemap generation for static optimization
 * This can be used during the build process for better performance
 */

import { promises as fs } from 'fs'
import path from 'path'
import { discoverPages, generateSitemapXML } from './sitemap-utils'

interface BuildConfig {
  siteUrl: string
  outputPath?: string
  appDir?: string
}

/**
 * Generate sitemap at build time
 */
export async function generateStaticSitemap(config: BuildConfig): Promise<string> {
  const { siteUrl, outputPath, appDir = path.join(process.cwd(), 'src', 'app') } = config

  try {
    console.log('🗺️  Generating sitemap...')

    // Discover all pages
    const pages = await discoverPages(appDir)
    console.log(`📄 Found ${pages.length} pages`)

    // Generate XML
    const sitemapXML = generateSitemapXML(siteUrl, pages)

    // Write to file if output path is specified
    if (outputPath) {
      await fs.writeFile(outputPath, sitemapXML, 'utf8')
      console.log(`✅ Sitemap written to ${outputPath}`)
    }

    // Log discovered routes for debugging
    console.log('📋 Discovered routes:')
    pages.forEach(page => {
      console.log(`   ${page.route} (priority: ${page.priority}, changefreq: ${page.changefreq})`)
    })

    return sitemapXML
  } catch (error) {
    console.error('❌ Error generating sitemap:', error)
    throw error
  }
}

/**
 * CLI runner for build scripts
 */
export async function runBuildSitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tendertales.ca'

  const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml')

  try {
    await generateStaticSitemap({ siteUrl, outputPath })
    process.exit(0)
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
    process.exit(1)
  }
}

// Allow direct execution
if (require.main === module) {
  runBuildSitemap()
}
