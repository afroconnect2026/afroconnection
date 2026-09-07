// AI helper functions using Google Gemini API (100% FREE!)
// Safe for server-side use only (API key required)

import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini client (server-side only)
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY not configured. Add it to your .env.local file.')
  }

  return new GoogleGenerativeAI(apiKey)
}

/**
 * Generate an enhanced professional bio using AI
 * @param userInput - The user's basic bio/description
 * @param userType - Type of user (entrepreneur, investor, professional, company)
 * @param context - Additional context (industry, skills, etc.)
 * @returns Enhanced bio string
 */
export async function generateEnhancedBio(
  userInput: string,
  userType: string,
  context?: {
    industry?: string
    skills?: string[]
    experience?: string
  }
): Promise<string> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `You are a professional bio writer for AfroConnect, a professional networking platform for African entrepreneurs, investors, and professionals.

User Type: ${userType}
User's Current Bio: "${userInput}"
${context?.industry ? `Industry: ${context.industry}` : ''}
${context?.skills ? `Skills: ${context.skills.join(', ')}` : ''}
${context?.experience ? `Experience: ${context.experience}` : ''}

Task: Enhance this bio to be more professional, compelling, and suitable for a networking platform. Keep it concise (2-3 sentences, max 150 words) and highlight their unique value proposition.

Guidelines:
- Make it professional but approachable
- Emphasize achievements and expertise
- Be specific and concrete
- Avoid clichés and buzzwords
- Keep the user's voice and authenticity
- For entrepreneurs: highlight what they're building and their vision
- For investors: highlight investment focus and value they bring
- For professionals: highlight expertise and what they offer
- For companies: highlight mission and what they do

Return ONLY the enhanced bio text, nothing else. No explanations, no quotes, just the bio.`

  const result = await model.generateContent(prompt)
  const response = result.response
  const bioText = response.text()

  return bioText.trim()
}

/**
 * Generate conversation starters for dealroom
 * @param profile1 - First user's profile info
 * @param profile2 - Second user's profile info
 * @returns Array of conversation starter suggestions
 */
export async function generateConversationStarters(
  profile1: {
    name: string
    userType: string
    bio: string
    industry?: string
  },
  profile2: {
    name: string
    userType: string
    bio: string
    industry?: string
  }
): Promise<string[]> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `You are helping two professionals on AfroConnect start a meaningful conversation.

Person 1: ${profile1.name} (${profile1.userType})
Bio: ${profile1.bio}
${profile1.industry ? `Industry: ${profile1.industry}` : ''}

Person 2: ${profile2.name} (${profile2.userType})
Bio: ${profile2.bio}
${profile2.industry ? `Industry: ${profile2.industry}` : ''}

Task: Generate 3 conversation starters that would help them start a meaningful professional conversation. The starters should:
- Be specific to their profiles and backgrounds
- Identify potential synergies or common ground
- Be open-ended questions or discussion points
- Be professional but friendly
- Focus on collaboration opportunities

Return ONLY a JSON array of 3 strings, nothing else. Format:
["Starter 1", "Starter 2", "Starter 3"]`

  const result = await model.generateContent(prompt)
  const response = result.response
  const responseText = response.text()

  try {
    // Clean up response (remove markdown code blocks if present)
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const starters = JSON.parse(cleaned)
    return Array.isArray(starters) ? starters : []
  } catch (error) {
    console.error('Error parsing conversation starters:', error)
    return [
      "What inspired you to get started in this industry?",
      "What are you currently working on that excites you?",
      "How can we potentially collaborate or help each other?"
    ]
  }
}

/**
 * Analyze opportunity match for a user
 * @param userProfile - User's profile data
 * @param opportunity - Opportunity details
 * @returns Match analysis with score and reasons
 */
export async function analyzeOpportunityMatch(
  userProfile: {
    bio: string
    userType: string
    skills?: string[]
    industry?: string
  },
  opportunity: {
    title: string
    description: string
    type: string
    requirements?: string
  }
): Promise<{
  score: number
  reasons: string[]
  missingSkills: string[]
  recommendation: string
}> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `You are analyzing how well a user matches an opportunity on AfroConnect.

User Profile:
- Type: ${userProfile.userType}
- Bio: ${userProfile.bio}
${userProfile.skills ? `- Skills: ${userProfile.skills.join(', ')}` : ''}
${userProfile.industry ? `- Industry: ${userProfile.industry}` : ''}

Opportunity:
- Title: ${opportunity.title}
- Type: ${opportunity.type}
- Description: ${opportunity.description}
${opportunity.requirements ? `- Requirements: ${opportunity.requirements}` : ''}

Task: Analyze the match and return ONLY a JSON object with:
{
  "score": <number 0-100>,
  "reasons": ["reason1", "reason2", "reason3"],
  "missingSkills": ["skill1", "skill2"],
  "recommendation": "one sentence recommendation"
}

Be honest and helpful. Return ONLY the JSON object, no markdown formatting, no explanations.`

  const result = await model.generateContent(prompt)
  const response = result.response
  const responseText = response.text()

  try {
    // Clean up response (remove markdown code blocks if present)
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysis = JSON.parse(cleaned)
    return {
      score: analysis.score || 0,
      reasons: analysis.reasons || [],
      missingSkills: analysis.missingSkills || [],
      recommendation: analysis.recommendation || 'Review this opportunity to see if it matches your goals.'
    }
  } catch (error) {
    console.error('Error parsing opportunity match:', error)
    return {
      score: 50,
      reasons: ['Moderate match based on general profile'],
      missingSkills: [],
      recommendation: 'Review the opportunity details to determine if it\'s a good fit.'
    }
  }
}
