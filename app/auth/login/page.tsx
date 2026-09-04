'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please fill all fields')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        toast.success('Welcome back!')
        router.refresh() // Sync auth cookies with middleware/server

        // Redirect to original destination or dashboard
        const redirectTo = searchParams.get('redirectedFrom')
        const destination = (redirectTo && redirectTo.startsWith('/')) ? redirectTo : '/dashboard'
        router.push(destination)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 flex items-center justify-center px-4 py-12">
      {/* Back to Home */}
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
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-300 text-lg">
            Sign in to access global opportunities
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
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
                  required
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
                  placeholder="Enter your password"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-8"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </div>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-100">
            <p className="text-center text-gray-700 font-semibold mb-4">
              New to AfroConnect?
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Link
                href="/auth/register?role=investor"
                className="text-center py-2.5 px-3 bg-gradient-to-br from-gold-50 to-gold-100 border-2 border-gold-200 text-gold-800 rounded-lg hover:from-gold-100 hover:to-gold-200 hover:border-gold-300 transition-all text-sm font-semibold"
              >
                I'm an Investor
              </Link>
              <Link
                href="/auth/register?role=founder"
                className="text-center py-2.5 px-3 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 text-primary-800 rounded-lg hover:from-primary-100 hover:to-primary-200 hover:border-primary-300 transition-all text-sm font-semibold"
              >
                I'm a Founder
              </Link>
              <Link
                href="/auth/register?role=opportunities"
                className="text-center py-2.5 px-3 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 text-blue-800 rounded-lg hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all text-sm font-semibold"
              >
                Looking for Work
              </Link>
              <Link
                href="/auth/register?role=funding"
                className="text-center py-2.5 px-3 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 text-purple-800 rounded-lg hover:from-purple-100 hover:to-purple-200 hover:border-purple-300 transition-all text-sm font-semibold"
              >
                Need Funding
              </Link>
            </div>
            <Link
              href="/auth/register"
              className="block text-center text-primary-600 hover:text-primary-700 font-semibold hover:underline text-sm"
            >
              Or choose your path →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
      <LoginForm />
    </Suspense>
  )
}
