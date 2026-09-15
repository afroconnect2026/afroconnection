import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateConversationStarters } from '@/lib/ai/openai'

// AI Conversation Starters API - OpenAI Powered
export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()
    const { otherUserId } = body

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'Other user ID is required' },
        { status: 400 }
      )
    }

    // Fetch current user profile
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('full_name, bio, user_type, industry')
      .eq('id', user.id)
      .single()

    if (currentProfileError || !currentProfile) {
      return NextResponse.json(
        { error: 'Current user profile not found' },
        { status: 404 }
      )
    }

    // Fetch other user profile
    const { data: otherProfile, error: otherProfileError } = await supabase
      .from('profiles')
      .select('full_name, bio, user_type, industry')
      .eq('id', otherUserId)
      .single()

    if (otherProfileError || !otherProfile) {
      return NextResponse.json(
        { error: 'Other user profile not found' },
        { status: 404 }
      )
    }

    // Generate conversation starters
    const starters = await generateConversationStarters(
      {
        name: currentProfile.full_name || 'User',
        userType: currentProfile.user_type || 'professional',
        bio: currentProfile.bio || '',
        industry: currentProfile.industry || undefined
      },
      {
        name: otherProfile.full_name || 'User',
        userType: otherProfile.user_type || 'professional',
        bio: otherProfile.bio || '',
        industry: otherProfile.industry || undefined
      }
    )

    return NextResponse.json({
      success: true,
      starters
    })

  } catch (error: any) {
    console.error('Conversation starters error:', error)

    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate conversation starters. Please try again.' },
      { status: 500 }
    )
  }
}
