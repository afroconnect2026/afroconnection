/**
 * URL Sanitization Utility
 * Prevents XSS attacks via javascript: and data: URLs
 *
 * SECURITY: User-submitted URLs (profile links, opportunity URLs, event virtual links)
 * can contain javascript: URLs that execute when clicked, stealing session cookies.
 * This helper validates that URLs are safe HTTP/HTTPS links only.
 */

/**
 * Validates and sanitizes a URL to prevent XSS attacks
 * @param url - The URL to validate
 * @param fallback - Optional fallback URL if validation fails (default: '#')
 * @returns Safe URL or fallback
 */
export function safeUrl(url: string | null | undefined, fallback: string = '#'): string {
  // Handle null/undefined/empty
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback
  }

  const trimmedUrl = url.trim()

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i
  if (dangerousProtocols.test(trimmedUrl)) {
    console.warn(`Blocked dangerous URL: ${trimmedUrl}`)
    return fallback
  }

  // Allow only http, https, mailto, and tel protocols
  const safeProtocols = /^(https?|mailto|tel):/i

  // If it has a protocol, verify it's safe
  if (trimmedUrl.includes(':')) {
    if (!safeProtocols.test(trimmedUrl)) {
      console.warn(`Blocked unsafe protocol in URL: ${trimmedUrl}`)
      return fallback
    }
    return trimmedUrl
  }

  // No protocol - assume https:// for external links
  // Check if it looks like a domain (contains a dot)
  if (trimmedUrl.includes('.') && !trimmedUrl.startsWith('/')) {
    return `https://${trimmedUrl}`
  }

  // Relative path - return as-is
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl
  }

  // Fallback for anything else
  console.warn(`Could not validate URL format: ${trimmedUrl}`)
  return fallback
}

/**
 * Validates that a URL is a safe external link (http/https only)
 * @param url - The URL to validate
 * @returns True if safe, false otherwise
 */
export function isExternalUrlSafe(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  const trimmedUrl = url.trim()

  // Must start with http:// or https://
  const httpsPattern = /^https?:\/\/.+/i

  return httpsPattern.test(trimmedUrl)
}

/**
 * Validates that a notification link is safe (internal path only)
 * @param link - The link to validate
 * @returns Safe link or null
 */
export function safeNotificationLink(link: string | null | undefined): string | null {
  if (!link || typeof link !== 'string') {
    return null
  }

  const trimmedLink = link.trim()

  // Only allow internal paths starting with /
  if (trimmedLink.startsWith('/') && !trimmedLink.includes('://')) {
    return trimmedLink
  }

  console.warn(`Blocked non-internal notification link: ${trimmedLink}`)
  return null
}

/**
 * React component helper - safely render external links
 * @param url - The URL to open
 * @returns Props object for <a> tag
 */
export function safeExternalLinkProps(url: string | null | undefined) {
  const safeHref = safeUrl(url)

  if (safeHref === '#') {
    return {
      href: '#',
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        console.warn('Blocked unsafe URL from being opened')
      },
      className: 'cursor-not-allowed opacity-50',
      title: 'Invalid or unsafe URL'
    }
  }

  return {
    href: safeHref,
    target: '_blank',
    rel: 'noopener noreferrer',
  }
}
