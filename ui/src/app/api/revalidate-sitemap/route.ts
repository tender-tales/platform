import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * API endpoint to revalidate sitemap cache
 * Useful for triggering sitemap regeneration after content changes
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    const authHeader = request.headers.get('authorization')
    const secretToken = process.env.REVALIDATION_SECRET

    if (secretToken && authHeader !== `Bearer ${secretToken}`) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Clear the sitemap cache by revalidating the path
    revalidatePath('/sitemap.xml')

    // You can also revalidate other related paths
    revalidatePath('/robots.txt')

    console.log('🔄 Sitemap cache revalidated')

    return NextResponse.json({
      message: 'Sitemap cache revalidated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error revalidating sitemap:', error)

    return NextResponse.json(
      { message: 'Error revalidating sitemap', error: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check revalidation status
 */
export async function GET() {
  return NextResponse.json({
    message: 'Sitemap revalidation endpoint is active',
    usage: 'POST to this endpoint to revalidate sitemap cache',
    authentication: process.env.REVALIDATION_SECRET ? 'Required (Bearer token)' : 'Not configured'
  })
}
