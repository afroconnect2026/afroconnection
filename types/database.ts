export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          user_type: 'entrepreneur' | 'investor' | 'professional' | 'company'
          /** Role specific CTA the member signed up through. */
          signup_role: string | null
          /** What the member came to AfroConnect to do. */
          primary_goal: string | null
          /** Answer to the role specific onboarding question. */
          onboarding_answer: string | null
          country: string | null
          city: string | null
          phone: string | null
          website: string | null
          linkedin_url: string | null
          twitter_url: string | null
          is_verified: boolean
          is_active: boolean
          onboarding_completed: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          user_type: 'entrepreneur' | 'investor' | 'professional' | 'company'
          signup_role?: string | null
          primary_goal?: string | null
          onboarding_answer?: string | null
          country?: string | null
          city?: string | null
          phone?: string | null
          website?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          user_type?: 'entrepreneur' | 'investor' | 'professional' | 'company'
          signup_role?: string | null
          primary_goal?: string | null
          onboarding_answer?: string | null
          country?: string | null
          city?: string | null
          phone?: string | null
          website?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          is_verified?: boolean
          is_active?: boolean
          onboarding_completed?: boolean
        }
      }
      entrepreneur_profiles: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          industry: string[]
          skills: string[]
          experience_years: number | null
          looking_for: string[]
          startup_stage: string | null
          company_name: string | null
          company_description: string | null
          funding_stage: string | null
          team_size: number | null
          revenue_range: string | null
        }
      }
      investor_profiles: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          investment_focus: string[]
          investment_stage: string[]
          ticket_size_min: number | null
          ticket_size_max: number | null
          regions_of_interest: string[]
          portfolio_companies: number | null
          verified_investor: boolean
        }
      }
      professional_profiles: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          job_title: string | null
          expertise: string[]
          years_of_experience: number | null
          available_for: string[]
          hourly_rate: number | null
          languages: string[]
          certifications: string[]
        }
      }
      company_profiles: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          company_name: string
          company_size: string | null
          industry: string[]
          founded_year: number | null
          headquarters: string | null
          website: string
          description: string | null
          hiring: boolean
        }
      }
      opportunities: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          creator_id: string
          title: string
          description: string
          type: 'investment' | 'partnership' | 'mentorship' | 'job' | 'cofounder'
          industry: string[]
          location: string | null
          remote_ok: boolean
          budget_min: number | null
          budget_max: number | null
          status: 'active' | 'closed' | 'draft'
          expires_at: string | null
          views_count: number
          applications_count: number
        }
      }
      matches: {
        Row: {
          id: string
          created_at: string
          user_a_id: string
          user_b_id: string
          match_score: number
          match_reason: string | null
          status: 'pending' | 'accepted' | 'rejected'
          viewed_by_a: boolean
          viewed_by_b: boolean
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          conversation_id: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'entrepreneur' | 'investor' | 'professional' | 'company'
    }
  }
}
