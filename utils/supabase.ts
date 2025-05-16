import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { logger } from '@/lib/logging'
import { getCookieOptions } from '@/lib/supabase/cookies'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create the Supabase client with cookie support
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookieOptions: getCookieOptions(false)  // false for client-side
  }
)

// Helper to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      logger.error('Error checking authentication', { error: error.message })
      return false
    }
    return !!session
  } catch (error) {
    logger.error('Error in isAuthenticated', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return false
  }
}

// Helper to check if user is admin
export const isAdmin = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      logger.error('Error getting session', { error: sessionError.message })
      return false
    }
    if (!session) return false

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      logger.error('Error checking admin status', { error: profileError.message })
      return false
    }

    return profile?.role === 'admin'
  } catch (error) {
    logger.error('Error in isAdmin', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return false
  }
}

// Helper to get current user profile
export const getCurrentUser = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      logger.error('Error getting session', { error: sessionError.message })
      return null
    }
    if (!session) return null

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      logger.error('Error getting user profile', { error: profileError.message })
      return null
    }

    return profile
  } catch (error) {
    logger.error('Error in getCurrentUser', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return null
  }
} 