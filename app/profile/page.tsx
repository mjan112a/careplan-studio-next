import { logger } from '@/lib/logging'
import { headers } from 'next/headers'
import { getBaseUrl } from '@/utils/url'

export const runtime = 'nodejs'

export default async function ProfilePage() {
  try {
    // Get the base URL and auth cookie from the headers
    const headersList = await headers()
    const baseUrl = await getBaseUrl(headersList)
    
    const response = await fetch(`${baseUrl}/api/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: headersList.get('cookie') || ''
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`)
    }

    const profile = await response.json()

    return (
      <div>
        <h1>Profile</h1>
        <pre>{JSON.stringify(profile, null, 2)}</pre>
      </div>
    )
  } catch (error) {
    logger.error('Error in profile page:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return <div>Error loading profile</div>
  }
} 