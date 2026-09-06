'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, UserPlus } from 'lucide-react'
import PublicNav from '@/components/marketing/PublicNav'
import PublicFooter from '@/components/marketing/PublicFooter'
import HowItWorks from '@/components/marketing/HowItWorks'
import AiExplained from '@/components/marketing/AiExplained'
import RoleCtas from '@/components/marketing/RoleCtas'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900">
      <PublicNav active="/how-it-works" />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6"
          >
            From Sign Up to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
              Signed Deal
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            AfroConnect connects you with the right people at the right time. No cold outreach,
            no gatekeeping — just the introduction that moves your work forward.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-gradient-gold text-navy-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-gold-500/50 transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works - Full Journey + Platform Pillars */}
      <HowItWorks variant="full" />

      {/* AI Matching Explanation */}
      <AiExplained />

      {/* Role-Based CTAs */}
      <div className="bg-white/5 backdrop-blur-sm">
        <RoleCtas variant="compact" />
      </div>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join the entrepreneurs, investors and professionals building the future of African
            business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-gradient-gold text-navy-900 px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-gold-500/50 transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/preview"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white px-8 py-5 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
            >
              Browse the Preview
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
