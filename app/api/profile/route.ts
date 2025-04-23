import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'
import { logger } from '@/lib/logging'
import { createServerSupabaseClient } from '@/lib/supabase/client'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single()
      
    if (error) {
      logger.error('Error fetching profile:', { error })
      return NextResponse.json({ error: error.message }, { status: 500 })
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
    const updates = await request.json()
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert(updates)
      .select()
      .single()
      
    if (error) {
      logger.error('Error updating profile:', { error })
      return NextResponse.json({ error: error.message }, { status: 500 })
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