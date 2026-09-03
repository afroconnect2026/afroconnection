'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Rocket,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROLE_CTAS } from '@/lib/marketing/content'
import type { RoleCta } from '@/lib/marketing/content'

const roleIcons: Record<RoleCta['icon'], LucideIcon> = {
  TrendingUp,
  Rocket,
  Briefcase,
  DollarSign,
}

interface RoleCtasProps {
  /** `full` renders the section with heading and benefit lists. */
  variant?: 'full' | 'compact'
  heading?: string
  subheading?: string
  className?: string
}

export default function RoleCtas({
  variant = 'full',
  heading = 'Where do you fit in?',
  subheading = 'Pick the path that describes you. Your onboarding, matches and feed are tuned to it from the first click.',
  className = '',
}: RoleCtasProps) {
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
        {ROLE_CTAS.map((role) => {
          const Icon = roleIcons[role.icon]

          return (
            <Link
              key={role.slug}
              href={`/auth/register?role=${role.slug}`}
              className="group inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/25 text-white px-5 py-3 rounded-xl font-semibold text-sm sm:text-base hover:bg-gold-500 hover:text-navy-900 hover:border-gold-500 transition-all"
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{role.label}</span>
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <section id="get-started" className={`py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
            {heading}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            {subheading}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ROLE_CTAS.map((role, i) => {
            const Icon = roleIcons[role.icon]

            return (
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
                  className="group flex flex-col w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 hover:bg-white/10 hover:border-gold-500/50 transition-all"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{role.label}</h3>
                  <p className="text-gray-300 text-sm mb-5 leading-relaxed">
                    {role.subheadline}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {role.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start text-sm text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-primary-500 mr-2 mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <span className="mt-auto inline-flex items-center gap-2 text-gold-500 font-semibold text-sm group-hover:text-gold-400">
                    Start here
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          Not sure yet?{' '}
          <Link href="/preview" className="text-gold-500 hover:text-gold-400 font-semibold">
            Browse the network first
          </Link>{' '}
          — no account needed.
        </p>
      </div>
    </section>
  )
}
