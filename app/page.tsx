'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import {
  Handshake,
  TrendingUp,
  Users,
  Globe2,
  Sparkles,
  Target,
  Rocket,
  Award,
  ArrowRight,
  CheckCircle2,
  Building2,
  Briefcase,
  DollarSign,
  UserPlus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Background images
  const heroImages = [
    '/hero-1.png',
    '/hero-2.png',
    '/hero-3.png'
  ]

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/icons/icon-192x192.png"
                alt="AfroConnect"
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-white font-display font-bold text-xl">
                  Afro<span className="text-gold-500">Connect</span>
                </h1>
                <p className="text-xs text-gray-300 hidden sm:block">Building Bridges. Creating Futures.</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-white hover:text-gold-400 transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 px-6 py-2.5 rounded-lg font-bold hover:shadow-xl hover:shadow-gold-500/60 hover:scale-105 transition-all text-sm shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden min-h-screen flex items-center">
        {/* Background Image Slider */}
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
                alt="AfroConnect Hero"
                fill
                className="object-cover"
                priority
                quality={90}
              />
              {/* Lighter overlay for text readability while showing images */}
              <div className="absolute inset-0 bg-gradient-to-br from-navy-900/70 via-navy-900/60 to-primary-900/75" />
            </motion.div>
          </AnimatePresence>

          {/* Animated gradient blobs */}
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gold-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-gold-500 w-8'
                  : 'bg-white/30 hover:bg-white/50'
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
            <span className="text-white text-sm font-medium">AI-Powered Professional Network</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight text-center"
            variants={fadeIn}
          >
            Connect the World to African<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
              Opportunities
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed"
            variants={fadeIn}
          >
            A global platform connecting worldwide investors, companies, and professionals
            with entrepreneurs and opportunities across Africa.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            variants={fadeIn}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/auth/register"
                className="relative bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 text-navy-900 px-10 py-5 rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-gold-500/60 transition-all flex items-center space-x-3 group overflow-hidden"
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10">START CONNECTING</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform relative z-10" />
              </Link>
            </motion.div>
            <Link
              href="/auth/register"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 hover:border-gold-500/50 transition-all"
            >
              Explore Platform
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            variants={stagger}
          >
            {[
              { icon: Globe2, label: '54', desc: 'African Countries' },
              { icon: Users, label: '4', desc: 'Member Types' },
              { icon: Building2, label: 'Free', desc: 'To Join' },
              { icon: DollarSign, label: '100%', desc: 'Verified Members' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                variants={fadeIn}
              >
                <stat.icon className="w-8 h-8 text-gold-500 mb-3 mx-auto" />
                <div className="text-3xl font-bold text-white mb-1">{stat.label}</div>
                <div className="text-sm text-gray-300">{stat.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Who We Serve */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Who We Serve
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              AfroConnect brings together the entire African entrepreneurship ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Rocket,
                title: 'Entrepreneurs',
                desc: 'African startups connecting with global investors, mentors, and partners',
                color: 'from-primary-500 to-primary-600',
                features: ['Global Investor Access', 'Pitch to Worldwide VCs', 'International Mentorship']
              },
              {
                icon: TrendingUp,
                title: 'Investors',
                desc: 'Global investors discovering high-potential African startups and opportunities',
                color: 'from-gold-500 to-gold-600',
                features: ['African Deal Flow', 'Due Diligence Tools', 'Portfolio Tracking']
              },
              {
                icon: Award,
                title: 'Professionals',
                desc: 'Experts worldwide offering services, consulting, and mentorship',
                color: 'from-blue-500 to-blue-600',
                features: ['Global Opportunities', 'Cross-Border Consulting', 'International Network']
              },
              {
                icon: Building2,
                title: 'Companies',
                desc: 'Businesses worldwide recruiting African talent and seeking partnerships',
                color: 'from-purple-500 to-purple-600',
                features: ['Access African Talent', 'Strategic Partnerships', 'Market Entry']
              },
            ].map((audience, i) => (
              <motion.div
                key={i}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                onHoverStart={() => setHoveredFeature(i)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${audience.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <audience.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{audience.title}</h3>
                <p className="text-gray-300 mb-6">{audience.desc}</p>
                <ul className="space-y-2">
                  {audience.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-sm text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-primary-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI-Powered Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-gold-500" />
              <span className="text-white text-sm font-medium">Powered by Advanced AI</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Smart Connections, Real Results
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our AI engine analyzes your goals, skills, and preferences to make perfect matches
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Smart Matching',
                desc: 'AI finds your ideal co-founders, investors, or partners based on compatibility scores'
              },
              {
                icon: Sparkles,
                title: 'Profile Optimization',
                desc: 'Get AI-powered suggestions to improve your profile and attract better opportunities'
              },
              {
                icon: TrendingUp,
                title: 'Opportunity Recommendations',
                desc: 'Personalized feed of relevant opportunities, jobs, and connections'
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:border-gold-500/50 transition-all"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <feature.icon className="w-12 h-12 text-gold-500 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Ready to Connect Africa to Opportunity?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of entrepreneurs, investors, and professionals building the future of African business
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-gradient-gold text-navy-900 px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-gold-500/50 transition-all flex items-center space-x-2 group"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src="/icons/icon-192x192.png"
                  alt="AfroConnect"
                  className="h-10 w-10"
                />
                <h3 className="text-white font-display font-bold text-xl">AfroConnect</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Building bridges between global investors and African entrepreneurs. Creating futures through connection and opportunity.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/explore" className="text-gray-400 hover:text-gold-500 transition-colors">Explore</Link></li>
                <li><Link href="/opportunities" className="text-gray-400 hover:text-gold-500 transition-colors">Opportunities</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-gold-500 transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="text-gray-400 hover:text-gold-500 transition-colors">Blog</Link></li>
                <li><Link href="/help" className="text-gray-400 hover:text-gold-500 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-gold-500 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legal/privacy" className="text-gray-400 hover:text-gold-500 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="text-gray-400 hover:text-gold-500 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} AfroConnect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
