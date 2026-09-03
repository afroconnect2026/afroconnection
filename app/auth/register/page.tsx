'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  DollarSign,
  Lock,
  Mail,
  Rocket,
  Target,
  TrendingUp,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getOnboardingQuestion,
  getRoleCta,
  ROLE_CTAS,
} from '@/lib/marketing/content'
import type { PlatformUserType, RoleCta } from '@/lib/marketing/content'

type UserType = PlatformUserType

const userTypes: {
  value: UserType
  icon: LucideIcon
  title: string
  desc: string
  color: string
}[] = [
  {
    value: 'entrepreneur',
    icon: Rocket,
    title: 'Entrepreneur',
    desc: 'Startup seeking global investors and opportunities',
    color: 'from-primary-500 to-primary-600',
  },
  {
    value: 'investor',
    icon: TrendingUp,
    title: 'Investor',
    desc: 'Discover high-potential opportunities worldwide',
    color: 'from-gold-500 to-gold-600',
  },
  {
    value: 'professional',
    icon: Award,
    title: 'Professional',
    desc: 'Expert offering services worldwide',
    color: 'from-blue-500 to-blue-600',
  },
  {
    value: 'company',
    icon: Building2,
    title: 'Company',
    desc: 'Hiring talent or seeking partnerships',
    color: 'from-purple-500 to-purple-600',
  },
]

const roleIcons: Record<RoleCta['icon'], LucideIcon> = {
  TrendingUp,
  Rocket,
  Briefcase,
  DollarSign,
}

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  /** Role specific entry point, e.g. /auth/register?role=investor */
  const role = getRoleCta(searchParams.get('role'))

  const [step, setStep] = useState(role ? 2 : 1)
  const [userType, setUserType] = useState<UserType | null>(role?.userType ?? null)
  const [goalAnswer, setGoalAnswer] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onboarding = userType ? getOnboardingQuestion(userType, role) : null
  const totalSteps = 3

  const handleRegister = async () => {
    if (!userType || !fullName || !email || !password) {
      toast.error('Please fill all fields')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
            // Role specific onboarding context. Persisted to `profiles` by the
            // handle_new_user trigger (see sql/add-role-onboarding-fields.sql).
            signup_role: role?.slug ?? userType,
            primary_goal: onboarding?.primaryGoal ?? null,
            onboarding_answer: goalAnswer || null,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Profile is created by the database trigger (handle_new_user)
        if (authData.session) {
          toast.success('Account created successfully! Welcome to AfroConnect.')
          router.refresh()
          router.push('/dashboard')
        } else {
          toast.success('Account created! Please check your email to confirm.')
          router.push('/auth/login')
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const RoleIcon = role ? roleIcons[role.icon] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 flex items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center space-x-2 text-white hover:text-gold-400 transition-colors z-50"
      >
        <img
          src="/logo-afroconnect.png"
          alt="AfroConnect"
          className="h-12 w-auto object-contain"
        />
      </Link>

      <motion.div
        className="w-full max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header — tailored to the role the visitor arrived with */}
        <div className="text-center mb-8 px-4">
          {role && RoleIcon && (
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-4">
              <RoleIcon className="w-4 h-4 text-gold-500" />
              <span className="text-white text-sm font-medium">{role.label}</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
            {role ? role.headline : 'Join AfroConnect'}
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
            {role
              ? role.subheadline
              : 'Connect with entrepreneurs, investors, and opportunities worldwide'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-10 space-x-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold transition-all shadow-lg ${
                  step >= s
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white scale-110'
                    : 'bg-white/90 text-gray-400 border-2 border-white/30'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
              </div>
              {s < totalSteps && (
                <div
                  className={`w-14 sm:w-20 h-1.5 mx-3 rounded-full transition-all ${
                    step > s ? 'bg-primary-500' : 'bg-white/30'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Choose member type */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">I am a...</h2>
              <p className="text-gray-400">Choose the option that best describes you</p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {userTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setUserType(type.value)
                    setGoalAnswer('')
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all text-left shadow-lg ${
                    userType === type.value
                      ? 'border-primary-500 bg-white scale-105'
                      : 'border-gray-200 bg-white/95 hover:bg-white hover:scale-[1.02] hover:border-primary-300'
                  }`}
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <type.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{type.title}</h3>
                  <p className="text-gray-600 text-sm">{type.desc}</p>
                  {userType === type.value && (
                    <div className="mt-3 flex items-center text-primary-600 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Selected
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => userType && setStep(2)}
              disabled={!userType}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-8"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Quick role entry points */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-center text-gray-400 text-sm mb-3">Or start from a goal</p>
              <div className="flex flex-wrap justify-center gap-2">
                {ROLE_CTAS.map((option) => (
                  <Link
                    key={option.slug}
                    href={`/auth/register?role=${option.slug}`}
                    className="text-xs sm:text-sm text-gray-200 bg-white/5 hover:bg-white/15 border border-white/15 rounded-full px-4 py-2 transition-all"
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Role specific onboarding question */}
        {step === 2 && onboarding && userType && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8"
          >
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 text-primary-600 text-sm font-semibold mb-3">
                <Target className="w-4 h-4" />
                Tailoring your matches
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {onboarding.question}
              </h2>
              <p className="text-gray-600">
                This is the single field that most improves who we match you with. You can
                change it later in your profile.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {onboarding.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setGoalAnswer(option)}
                  className={`px-5 py-4 rounded-xl border-2 text-left font-medium transition-all ${
                    goalAnswer === option
                      ? 'border-primary-500 bg-primary-50 text-primary-800'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary-300 hover:bg-white'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    {option}
                    {goalAnswer === option && (
                      <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0" />
                    )}
                  </span>
                </button>
              ))}
            </div>

            {role && (
              <ul className="mt-8 space-y-2 bg-gray-50 border border-gray-200 rounded-xl p-5">
                {role.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-primary-600 mr-2 mt-0.5 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 space-y-4">
              <button
                onClick={() => setStep(3)}
                disabled={!goalAnswer}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Back
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Account details */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-600">Fill in your details to get started</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {userType === 'company'
                    ? 'Company Name'
                    : userType === 'investor'
                      ? 'Organization/Individual Name'
                      : 'Full Name'}
                </label>
                {(userType === 'company' || userType === 'investor') && (
                  <p className="text-sm text-gray-500 mb-2">
                    {userType === 'company'
                      ? 'Enter your organization or company name'
                      : 'Enter your fund name, organization, or your full name'}
                  </p>
                )}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={
                      userType === 'company'
                        ? 'e.g., Acme Corporation'
                        : userType === 'investor'
                          ? 'e.g., ABC Ventures or John Smith'
                          : 'e.g., John Doe'
                    }
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Use at least 8 characters with letters and numbers
                </p>
              </div>
            </div>

            {/* Recap of the tailored onboarding */}
            {goalAnswer && (
              <div className="mt-6 flex items-start gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                <p className="text-sm text-primary-800">
                  We will tune your matches for{' '}
                  <span className="font-semibold">{goalAnswer.toLowerCase()}</span>.
                </p>
              </div>
            )}

            <div className="mt-8 space-y-4">
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            </div>

            <p className="text-center text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  )
}
