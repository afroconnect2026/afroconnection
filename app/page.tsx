'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  DollarSign,
  Globe2,
  Rocket,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'

import PublicNav from '@/components/marketing/PublicNav'
import PublicFooter from '@/components/marketing/PublicFooter'
import HowItWorks from '@/components/marketing/HowItWorks'
import RoleCtas from '@/components/marketing/RoleCtas'
import Testimonials from '@/components/marketing/Testimonials'
import PreviewShowcase from '@/components/marketing/PreviewShowcase'
import { PLATFORM_FOCUS, TAGLINE_SUPPORT } from '@/lib/marketing/content'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const heroImages = ['/hero-1.png', '/hero-2.png', '/hero-3.png']

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Auto-advance hero slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900">
      <PublicNav active="/" />

      {/* ---------------------------------------------------------- */}
      {/* Hero                                                        */}
      {/* ---------------------------------------------------------- */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0"
            >
              <Image
                src={heroImages[currentSlide]}
                alt=""
                fill
                className="object-cover"
                priority
                quality={90}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-navy-900/80 via-navy-900/70 to-primary-900/80" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-500/10 rounded-full blur-3xl animate-float" />
          <div
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gold-500/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '1s' }}
          />
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-gold-500 w-8' : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <motion.div
          className="max-w-7xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6"
            variants={fadeIn}
          >
            <Sparkles className="w-4 h-4 text-gold-500" />
            <span className="text-white text-sm font-medium">{PLATFORM_FOCUS}</span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight text-center px-4"
            variants={fadeIn}
          >
            Connecting Africa to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
              Opportunity
            </span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 mb-4 max-w-3xl mx-auto leading-relaxed px-4"
            variants={fadeIn}
          >
            {TAGLINE_SUPPORT}
          </motion.p>

          <motion.p
            className="text-sm sm:text-base text-gray-300 mb-10 max-w-2xl mx-auto px-4"
            variants={fadeIn}
          >
            Sign up, build a profile, get matched, connect — and build real opportunities.
          </motion.p>

          {/* Role specific calls to action */}
          <motion.div variants={fadeIn} className="mb-6 px-2">
            <p className="text-white/70 text-sm font-medium mb-4 uppercase tracking-wider">
              Get started as
            </p>
            <RoleCtas variant="compact" />
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            variants={fadeIn}
          >
            <Link
              href="/preview"
              className="inline-flex items-center justify-center gap-2 text-white/90 hover:text-gold-400 font-medium transition-colors text-sm sm:text-base"
            >
              Or see the network first — no account needed
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto px-4"
            variants={stagger}
          >
            {[
              { icon: Globe2, label: 'Worldwide', desc: 'Global Network' },
              { icon: Users, label: '4', desc: 'Member Types' },
              { icon: Building2, label: 'Free', desc: 'To Join' },
              { icon: DollarSign, label: '100%', desc: 'Verified Members' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/10 transition-all"
                variants={fadeIn}
              >
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-gold-500 mb-2 sm:mb-3 mx-auto" />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {stat.label}
                </div>
                <div className="text-xs sm:text-sm text-gray-300">{stat.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* 1. How It Works teaser */}
      <HowItWorks variant="compact" />

      {/* 7. Role specific calls to action */}
      <RoleCtas />

      {/* 6. Public preview — value before sign up */}
      <PreviewShowcase variant="landing" limit={4} />

      {/* 2. Testimonials, trust indicators and partners */}
      <Testimonials />

      {/* Closing CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Connect Africa to Opportunity?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-10">
            Join the entrepreneurs, investors and professionals building the future of
            African business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-gold-500/50 hover:scale-105 transition-all flex items-center space-x-2 group shadow-xl"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/preview"
              className="bg-white text-navy-900 px-8 py-5 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
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
