import { logger } from '@/lib/logging'
import { headers } from 'next/headers'
import { getBaseUrl } from '@/utils/url'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import ProfileForm from './ProfileForm'
import Navbar from '@/components/layout/Navbar'

export const runtime = 'nodejs'

export default async function ProfilePage() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      logger.error('No user found in authenticated session')
      return <div>Error: Not authenticated</div>
    }

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
      <>
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-8">Profile</h1>
          <ProfileForm 
            user={user} 
            initialProfile={profile || { id: user.id }} 
          />
        </div>
      </>
    )
  } catch (error) {
    logger.error('Error in profile page:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return (
      <>
        <Navbar user={null} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading profile
          </div>
        </div>
      </>
    )
  }
} 