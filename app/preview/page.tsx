'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, Lock, ShieldCheck } from 'lucide-react'
import PublicNav from '@/components/marketing/PublicNav'
import PublicFooter from '@/components/marketing/PublicFooter'
import PreviewShowcase from '@/components/marketing/PreviewShowcase'

const anchors: { label: string; href: string }[] = [
  { label: 'Events', href: '#preview-events' },
  { label: 'Opportunities', href: '#preview-opportunities' },
  { label: 'Investment deals', href: '#preview-deals' },
  { label: 'Success stories', href: '#preview-stories' },
]

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900">
      <PublicNav active="/preview" />

      {/* Hero */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <Eye className="w-4 h-4 text-gold-500" />
            <span className="text-white text-sm font-medium">
              Public preview — no sign up required
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
            See the network{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
              before you join
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Real events, featured opportunities, anonymised investment deals and examples of
            the matches we make. Everything sensitive stays private — members control what
            visitors can see.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {anchors.map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="text-sm text-gray-300 hover:text-gold-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 transition-all"
              >
                {anchor.label}
              </a>
            ))}
          </div>

          <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-400 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-primary-400 shrink-0" />
            Company names, contact details and full metrics are hidden until you are a
            verified member.
          </div>
        </motion.div>
      </section>

      <PreviewShowcase variant="full" limit={4} />

      {/* Closing CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-3xl mx-auto text-center">
          <Lock className="w-10 h-10 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6">
            This is the preview. The network is bigger.
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8">
            Create a free account to see full profiles, message members directly, apply to
            opportunities and get matched.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-gradient-gold text-navy-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-gold-500/50 transition-all group"
          >
            Create your free account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
