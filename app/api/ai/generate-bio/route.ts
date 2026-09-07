import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { generateEnhancedBio } from '@/lib/ai/anthropic'

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
    const { currentBio, userType, industry, skills, experience } = body

    // Validate input
    if (!currentBio || currentBio.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a bio with at least 10 characters' },
        { status: 400 }
      )
    }

    if (currentBio.length > 500) {
      return NextResponse.json(
        { error: 'Bio is too long. Please keep it under 500 characters.' },
        { status: 400 }
      )
    }

    // Generate enhanced bio
    const enhancedBio = await generateEnhancedBio(
      currentBio,
      userType || 'professional',
      {
        industry: industry || undefined,
        skills: skills || undefined,
        experience: experience || undefined
      }
    )

    return NextResponse.json({
      success: true,
      enhancedBio,
      originalLength: currentBio.length,
      enhancedLength: enhancedBio.length
    })

  } catch (error: any) {
    console.error('Bio generation error:', error)

    // Handle specific errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate bio. Please try again.' },
      { status: 500 }
    )
  }
}
