import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'
import { logger } from '@/lib/logging'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get user ID from authenticated session (middleware ensures this exists)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      logger.error('No user found in authenticated session')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    if (error) {
      if (error.code === 'PGRST104') {
        logger.info('No profile found for user, will be created during first update', {
          userId: user.id
        })
        return NextResponse.json(null)
      }
      
      logger.error('Error fetching profile:', { 
        error,
        userId: user.id
      })
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    logger.error('Error in profile fetch:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      logger.error('No user found in authenticated session')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const updates = await request.json()
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ 
        ...updates,
        id: user.id,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
      
    if (error) {
      logger.error('Error updating profile:', { 
        error,
        userId: user.id 
      })
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    logger.error('Error in profile update:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 