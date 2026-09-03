'use client'

import { motion } from 'framer-motion'
import { Gauge, Quote, Sparkles, Target } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  AI_CAPABILITIES,
  AI_HEADLINE,
  AI_SUBHEADLINE,
  SAMPLE_MATCHES,
} from '@/lib/marketing/content'
import type { AiCapability } from '@/lib/marketing/content'

const aiIcons: Record<AiCapability['icon'], LucideIcon> = {
  Target,
  Sparkles,
  Gauge,
}

export default function AiExplained() {
  return (
    <section id="ai" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-gold-500" />
            <span className="text-white text-sm font-medium">Matching, explained</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
            {AI_HEADLINE}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            {AI_SUBHEADLINE}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {AI_CAPABILITIES.map((capability, i) => {
            const Icon = aiIcons[capability.icon]

            return (
              <motion.div
                key={capability.title}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:border-gold-500/50 transition-all flex flex-col"
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.12 }}
                viewport={{ once: true }}
              >
                <Icon className="w-11 h-11 text-gold-500 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">{capability.title}</h3>

                <div className="relative bg-navy-900/50 border-l-4 border-gold-500 rounded-r-xl p-4 mb-4">
                  <Quote
                    aria-hidden="true"
                    className="w-4 h-4 text-gold-500/60 absolute top-3 right-3"
                  />
                  <p className="text-white font-medium leading-relaxed text-[15px]">
                    {capability.example}
                  </p>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed">{capability.supporting}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Worked example: what a match actually looks like */}
        <div className="mt-14 bg-white/5 border border-white/10 rounded-3xl p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            What a match looks like in practice
          </h3>
          <p className="text-gray-400 text-sm mb-8">
            Illustrative examples of the matches the engine produces — every one carries a
            score and a reason.
          </p>

          <div className="space-y-4">
            {SAMPLE_MATCHES.map((match) => (
              <div
                key={match.reason}
                className="grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center bg-navy-900/40 border border-white/10 rounded-2xl p-5"
              >
                <div className="text-sm text-gray-200">{match.personA}</div>

                <div className="flex md:flex-col items-center gap-2 justify-self-start md:justify-self-center">
                  <div className="w-16 h-16 rounded-full border-4 border-gold-500/70 flex items-center justify-center bg-navy-900">
                    <span className="text-gold-500 font-bold text-lg">{match.score}%</span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wide text-gray-500">
                    Match score
                  </span>
                </div>

                <div className="text-sm text-gray-200 md:text-right">{match.personB}</div>

                <p className="md:col-span-3 text-xs text-gray-400 border-t border-white/10 pt-3">
                  <span className="text-primary-400 font-semibold">Why: </span>
                  {match.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
