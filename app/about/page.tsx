'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Compass,
  Eye,
  Flag,
  Info,
  Linkedin,
  Target,
} from 'lucide-react'
import PublicNav from '@/components/marketing/PublicNav'
import PublicFooter from '@/components/marketing/PublicFooter'
import RoleCtas from '@/components/marketing/RoleCtas'
import SocialLinks from '@/components/marketing/SocialLinks'
import {
  IS_TEAM_PLACEHOLDER,
  MISSION_STATEMENT,
  OUR_VALUES,
  PLATFORM_FOCUS,
  TAGLINE,
  TEAM,
  VISION_STATEMENT,
} from '@/lib/marketing/content'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900">
      <PublicNav active="/about" />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Compass className="w-4 h-4 text-gold-500" />
            <span className="text-white text-sm font-medium">About AfroConnect</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
            {TAGLINE}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed">
            We are building the trusted network layer for African opportunity —{' '}
            {PLATFORM_FOCUS.toLowerCase()} — so the right people find each other on
            purpose rather than by luck.
          </p>
        </motion.div>
      </section>

      {/* Vision + Mission */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          <motion.div
            className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-3xl p-8 sm:p-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-6">
              <Eye className="w-7 h-7 text-navy-900" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4">
              Our Vision
            </h2>
            <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
              {VISION_STATEMENT}
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-3xl p-8 sm:p-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-4">
              Our Mission
            </h2>
            <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
              {MISSION_STATEMENT}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
              What We Stand For
            </h2>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
              Four principles that decide what we build and what we refuse to build.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {OUR_VALUES.map((value, i) => (
              <motion.div
                key={value.title}
                className="bg-navy-900/40 border border-white/10 rounded-2xl p-7 hover:border-gold-500/40 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Flag className="w-5 h-5 text-gold-500 shrink-0" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">{value.title}</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the team */}
      <section id="meet-the-team" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Meet the Team
            </h2>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
              The founders and operators building AfroConnect.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={`${member.name}-${i}`}
                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-2xl p-7 text-center hover:border-gold-500/50 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-5 border-4 border-gold-500/40"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto mb-5 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center border-4 border-gold-500/40">
                    <span className="text-white font-bold text-2xl">{member.initials}</span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                <p className="text-gold-500 text-sm font-medium mb-1">{member.role}</p>
                <p className="text-gray-500 text-xs mb-4">{member.location}</p>
                <p className="text-gray-300 text-sm leading-relaxed">{member.bio}</p>

                {member.linkedinUrl && (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} on LinkedIn (opens in a new tab)`}
                    className="inline-flex items-center gap-2 mt-5 text-gray-300 hover:text-gold-500 transition-colors text-sm"
                  >
                    <Linkedin className="w-4 h-4" />
                    Connect on LinkedIn
                  </a>
                )}
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-300 mb-4">Follow AfroConnect</p>
            <div className="flex justify-center">
              <SocialLinks includeEmail />
            </div>
          </div>
        </div>
      </section>

      {/* Role CTAs */}
      <div className="bg-white/5 backdrop-blur-sm">
        <RoleCtas
          heading="Join the network"
          subheading="Tell us who you are and we will tailor your onboarding, matches and feed from the first click."
        />
      </div>

      {/* Closing CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Want to see it before you join?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8">
            Browse live events, featured opportunities and anonymised deals — no account
            required.
          </p>
          <Link
            href="/preview"
            className="inline-flex items-center gap-2 bg-gradient-gold text-navy-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-gold-500/50 transition-all group"
          >
            Explore the public preview
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
