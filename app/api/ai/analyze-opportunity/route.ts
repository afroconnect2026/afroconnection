import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { analyzeOpportunityMatch } from '@/lib/ai/anthropic'

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
    const { opportunityId } = body

    if (!opportunityId) {
      return NextResponse.json(
        { error: 'Opportunity ID is required' },
        { status: 400 }
      )
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('bio, user_type, industry')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Fetch opportunity details
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('title, description, type, requirements')
      .eq('id', opportunityId)
      .single()

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      )
    }

    // Analyze match
    const analysis = await analyzeOpportunityMatch(
      {
        bio: profile.bio || '',
        userType: profile.user_type || 'professional',
        industry: profile.industry || undefined
      },
      {
        title: opportunity.title,
        description: opportunity.description || '',
        type: opportunity.type,
        requirements: opportunity.requirements || undefined
      }
    )

    return NextResponse.json({
      success: true,
      opportunityId,
      ...analysis
    })

  } catch (error: any) {
    console.error('Opportunity analysis error:', error)

    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to analyze opportunity. Please try again.' },
      { status: 500 }
    )
  }
}
