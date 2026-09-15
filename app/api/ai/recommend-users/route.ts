import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { analyzeUserMatch } from '@/lib/ai/openai'

// Smart User Recommendations API - OpenAI Powered
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

    // Get request body with profile data (avoiding database queries)
    const body = await request.json()
    const {
      targetUserId,
      currentUserProfile,
      targetUserProfile
    } = body

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      )
    }

    if (!currentUserProfile || !targetUserProfile) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      )
    }

    const currentProfile = currentUserProfile
    const targetProfile = targetUserProfile

    // Analyze match
    const analysis = await analyzeUserMatch(
      {
        bio: currentProfile.bio || '',
        userType: currentProfile.user_type || 'professional',
        industry: currentProfile.industry || undefined,
        country: currentProfile.country || undefined
      },
      {
        fullName: targetProfile.full_name || 'User',
        bio: targetProfile.bio || '',
        userType: targetProfile.user_type || 'professional',
        industry: targetProfile.industry || undefined,
        country: targetProfile.country || undefined
      }
    )

    return NextResponse.json({
      success: true,
      targetUserId,
      ...analysis
    })

  } catch (error: any) {
    console.error('User recommendation error:', error)

    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze user match. Please try again.' },
      { status: 500 }
    )
  }
}
