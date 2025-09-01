/**
 * Calculate estimated reading time for text content
 * @param text - The text content to analyze
 * @param wordsPerMinute - Average reading speed (default: 200 words per minute)
 * @returns Formatted reading time string (e.g., "5 min read")
 */
export function calculateReadingTime(text: string, wordsPerMinute: number = 200): string {
  if (!text || text.trim().length === 0) {
    return '1 min read'
  }

  // Remove HTML tags and extra whitespace
  let cleanText = text;
  let prevText;
  // Remove HTML tags recursively to prevent incomplete sanitization
  do {
    prevText = cleanText;
    cleanText = cleanText.replace(/<[^>]*>/g, '');
  } while (cleanText !== prevText);
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  // Count words (split by spaces and filter out empty strings)
  const wordCount = cleanText.split(' ').filter(word => word.length > 0).length

  // Calculate reading time in minutes
  const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute)

  // Ensure minimum of 1 minute
  const finalTime = Math.max(1, readingTimeMinutes)

  return `${finalTime} min read`
}

/**
 * Calculate reading time from React component content
 * @param content - React node or string content
 * @param wordsPerMinute - Average reading speed (default: 200 words per minute)
 * @returns Formatted reading time string
 */
export function calculateReadingTimeFromContent(content: any, wordsPerMinute: number = 200): string {
  if (typeof content === 'string') {
    return calculateReadingTime(content, wordsPerMinute)
  }

  // For React components, we'll need to extract text content
  // This is a simple implementation - for more complex content, consider using a library
  const textContent = extractTextFromReactElement(content)
  return calculateReadingTime(textContent, wordsPerMinute)
}

/**
 * Extract text content from React element (basic implementation)
 */
function extractTextFromReactElement(element: any): string {
  if (typeof element === 'string' || typeof element === 'number') {
    return String(element)
  }

  if (Array.isArray(element)) {
    return element.map(extractTextFromReactElement).join(' ')
  }

  if (element && typeof element === 'object' && element.props) {
    return extractTextFromReactElement(element.props.children)
  }

  return ''
}

/**
 * Generate a hash from content to track changes
 */
function generateContentHash(content: string): string {
  let hash = 0
  if (content.length === 0) return '0'

  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36)
}

/**
 * Get or set last updated date for content based on content hash
 * @param contentId - Unique identifier for the content (e.g., blog post slug)
 * @param content - The content to track
 * @returns ISO date string of when content was last updated
 */
export function getLastUpdatedDate(contentId: string, content: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return current date
    return new Date().toISOString()
  }

  const storageKey = `blog_lastUpdated_${contentId}`
  const contentHash = generateContentHash(content)
  const storedData = localStorage.getItem(storageKey)

  if (storedData) {
    try {
      const { hash, lastUpdated } = JSON.parse(storedData)

      // If content hasn't changed, return stored date
      if (hash === contentHash) {
        return lastUpdated
      }
    } catch (e) {
      // Handle corrupt stored data
      console.warn('Corrupt lastUpdated data for', contentId)
    }
  }

  // Content is new or has changed - update timestamp
  const now = new Date().toISOString()
  const newData = {
    hash: contentHash,
    lastUpdated: now
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(newData))
  } catch (e) {
    console.warn('Could not store lastUpdated data for', contentId)
  }

  return now
}

/**
 * Format date for display
 * @param isoDate - ISO date string
 * @returns Formatted date string (e.g., "December 15, 2024")
 */
export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (e) {
    return 'Recently'
  }
}

/**
 * Get relative time string (e.g., "2 days ago", "1 week ago")
 * @param isoDate - ISO date string
 * @returns Relative time string
 */
export function getRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return 'Just now'
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`
    } else {
      return formatDate(isoDate)
    }
  } catch (e) {
    return 'Recently'
  }
}
