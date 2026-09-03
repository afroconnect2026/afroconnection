'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  GraduationCap,
  Handshake,
  Rocket,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PublicNav from '@/components/marketing/PublicNav'
import PublicFooter from '@/components/marketing/PublicFooter'
import {
  HOW_IT_WORKS_STEPS,
  PLATFORM_PILLARS,
  ROLE_CTAS,
} from '@/lib/marketing/content'
import type { HowItWorksStep, PlatformPillar } from '@/lib/marketing/content'

const stepIcons: Record<HowItWorksStep['icon'], LucideIcon> = {
  UserPlus,
  FileText,
  Sparkles,
  Handshake,
  Rocket,
}

const pillarIcons: Record<PlatformPillar['icon'], LucideIcon> = {
  Users,
  TrendingUp,
  GraduationCap,
  Building2,
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900">
      <PublicNav active="/how-it-works" />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6"
          >
            <Handshake className="w-4 h-4 text-gold-500" />
            <span className="text-white text-sm font-medium">How It Works</span>
          </motion.div>

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

      {/* The 5-Step Journey */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
              The Five-Step Journey
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Every successful connection on AfroConnect follows this path
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-[4.5rem] left-[10%] right-[10%] h-1 bg-gradient-to-r from-primary-500/40 via-gold-500/60 to-primary-500/40 rounded-full"
            />

            <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 relative">
              {HOW_IT_WORKS_STEPS.map((step, i) => {
                const Icon = stepIcons[step.icon]

                return (
                  <motion.li
                    key={step.step}
                    className="relative"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-gold-500/40 transition-all h-full flex flex-col">
                      {/* Step number badge */}
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 mx-auto shadow-lg shadow-primary-500/50">
                        {step.step}
                      </div>

                      {/* Icon */}
                      <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                        <Icon className="w-7 h-7 text-gold-500" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>

                      {/* Description */}
                      <p className="text-gray-300 text-sm leading-relaxed flex-1">
                        {step.description}
                      </p>
                    </div>
                  </motion.li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* What You Get on the Platform */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
              What the Platform Does for You
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Four core capabilities that turn a directory into a network that actually introduces
              people
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {PLATFORM_PILLARS.map((pillar, i) => {
              const Icon = pillarIcons[pillar.icon]

              return (
                <motion.div
                  key={pillar.title}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-gold-500/40 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">{pillar.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{pillar.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Your Journey Starts Here */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Choose Your Starting Point
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Every path is tailored to what you're here to do
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLE_CTAS.map((role, i) => (
              <motion.div
                key={role.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex"
              >
                <Link
                  href={`/auth/register?role=${role.slug}`}
                  className="group flex flex-col w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-gold-500/50 transition-all"
                >
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">
                    {role.label}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 flex-1">{role.subheadline}</p>

                  <ul className="space-y-2 mb-4">
                    {role.benefits.slice(0, 3).map((benefit) => (
                      <li key={benefit} className="flex items-start text-xs text-gray-500">
                        <CheckCircle2 className="w-3 h-3 text-primary-500 mr-2 mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <span className="inline-flex items-center gap-2 text-gold-500 font-semibold text-sm group-hover:text-gold-400">
                    Start here
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            Not sure yet?{' '}
            <Link href="/preview" className="text-gold-500 hover:text-gold-400 font-semibold">
              Browse the network first
            </Link>{' '}
            — no account needed
          </p>
        </div>
      </section>

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
