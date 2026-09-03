'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
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
import {
  HOW_IT_WORKS_STEPS,
  PLATFORM_FOCUS,
  PLATFORM_PILLARS,
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

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 bg-white/5 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Handshake className="w-4 h-4 text-gold-500" />
            <span className="text-white text-sm font-medium">How It Works</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
            From sign up to signed deal
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Five steps. No cold outreach, no gatekeeping — just the introduction that
            moves your work forward.
          </p>
        </div>

        {/* Step flow */}
        <div className="relative">
          {/* Connector line on large screens */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-[3.25rem] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary-500/40 via-gold-500/50 to-primary-500/40"
          />

          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 relative">
            {HOW_IT_WORKS_STEPS.map((step, i) => {
              const Icon = stepIcons[step.icon]

              return (
                <motion.li
                  key={step.step}
                  className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 hover:border-gold-500/40 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  <div className="relative z-10 w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-900/40">
                    <Icon className="w-8 h-8 text-white" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gold-500 text-navy-900 text-sm font-bold flex items-center justify-center shadow">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{step.description}</p>

                  {i < HOW_IT_WORKS_STEPS.length - 1 && (
                    <ArrowRight
                      aria-hidden="true"
                      className="hidden lg:block absolute top-[3rem] -right-4 w-6 h-6 text-gold-500/70"
                    />
                  )}
                </motion.li>
              )
            })}
          </ol>
        </div>

        {/* Platform focus statement */}
        <div className="mt-16 bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-10">
            <p className="text-gold-500 font-semibold uppercase tracking-wider text-xs sm:text-sm mb-3">
              What AfroConnect is for
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white">
              {PLATFORM_FOCUS}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_PILLARS.map((pillar, i) => {
              const Icon = pillarIcons[pillar.icon]

              return (
                <motion.div
                  key={pillar.title}
                  className="bg-navy-900/40 border border-white/10 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  <Icon className="w-8 h-8 text-gold-500 mb-4" />
                  <h4 className="text-white font-bold text-lg mb-2">{pillar.title}</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{pillar.description}</p>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/preview"
              className="inline-flex items-center gap-2 text-gold-500 hover:text-gold-400 font-semibold transition-colors"
            >
              See what is inside before you sign up
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
