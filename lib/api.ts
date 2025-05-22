import { headers } from 'next/headers'
import { getBaseUrl } from '@/utils/url'
import { logger } from '@/lib/logging'

type FetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

/**
 * Makes an authenticated API call to an internal endpoint, automatically handling
 * cookie forwarding and base URL resolution.
 */
export async function fetchWithAuth<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  try {
    const headersList = await headers()
    const baseUrl = await getBaseUrl(headersList)
    const url = path.startsWith('http') ? path : `${baseUrl}${path}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: headersList.get('cookie') || '',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    logger.error('API call failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path,
    })
    throw error
  }
} 