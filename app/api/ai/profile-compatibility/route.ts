import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { currentUserId, targetUserId } = await request.json()

    if (!currentUserId || !targetUserId) {
      return NextResponse.json(
        { error: 'Both user IDs are required' },
        { status: 400 }
      )
    }

    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot compare a profile with itself' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Fetch both user profiles
    const [currentUserResult, targetUserResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single(),
      supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single(),
    ])

    if (currentUserResult.error || targetUserResult.error) {
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 404 }
      )
    }

    const currentUser = currentUserResult.data
    const targetUser = targetUserResult.data

    // Prepare profile summaries for AI analysis
    const currentUserSummary = `
Name: ${currentUser.full_name || 'Unknown'}
Bio: ${currentUser.bio || 'No bio'}
Skills: ${currentUser.skills?.join(', ') || 'None listed'}
Interests: ${currentUser.interests?.join(', ') || 'None listed'}
Industry: ${currentUser.industry || 'Not specified'}
Location: ${currentUser.location || 'Not specified'}
Looking For: ${currentUser.looking_for || 'Not specified'}
    `.trim()

    const targetUserSummary = `
Name: ${targetUser.full_name || 'Unknown'}
Bio: ${targetUser.bio || 'No bio'}
Skills: ${targetUser.skills?.join(', ') || 'None listed'}
Interests: ${targetUser.interests?.join(', ') || 'None listed'}
Industry: ${targetUser.industry || 'Not specified'}
Location: ${targetUser.location || 'Not specified'}
Looking For: ${targetUser.looking_for || 'Not specified'}
    `.trim()

    const systemPrompt = `You are an AI matchmaking assistant for a professional networking platform.
Analyze the compatibility between two user profiles and provide a detailed match analysis.

Return your analysis as a JSON object with this exact structure:
{
  "matchScore": <number 0-100>,
  "matchStrength": "<weak|moderate|strong>",
  "commonInterests": ["interest1", "interest2", ...],
  "complementarySkills": {
    "theyCanHelpYou": ["skill1", "skill2", ...],
    "youCanHelpThem": ["skill1", "skill2", ...]
  },
  "collaborationOpportunities": ["opportunity1", "opportunity2", ...],
  "recommendation": "<connect|maybe|skip>",
  "reasoning": "<1-2 sentence explanation of the match score and recommendation>"
}

Match Score Criteria:
- 90-100: Exceptional match (shared industry, complementary skills, aligned goals)
- 70-89: Strong match (several common interests, good skill alignment)
- 50-69: Moderate match (some overlap, potential for collaboration)
- 30-49: Weak match (limited common ground)
- 0-29: Poor match (minimal alignment)

Match Strength:
- strong: 70-100
- moderate: 40-69
- weak: 0-39

Recommendation:
- connect: 70+ score, clear mutual benefits
- maybe: 40-69 score, some potential benefits
- skip: below 40, minimal compatibility`

    const userPrompt = `Analyze the compatibility between these two professionals:

USER A (Current User):
${currentUserSummary}

USER B (Target User):
${targetUserSummary}

Provide a detailed match analysis focusing on how USER B can help USER A and vice versa.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 800,
    })

    const analysis = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({
      success: true,
      analysis,
      cachedUntil: Date.now() + 3600000, // Cache for 1 hour
    })
  } catch (error) {
    console.error('Profile compatibility error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze profile compatibility' },
      { status: 500 }
    )
  }
}
