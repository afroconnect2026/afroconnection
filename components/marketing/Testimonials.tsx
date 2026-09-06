'use client'

import { motion } from 'framer-motion'
import { Info, Quote, ShieldCheck, Star } from 'lucide-react'
import {
  IS_PARTNERS_PLACEHOLDER,
  IS_TESTIMONIALS_PLACEHOLDER,
  PARTNERS,
  TESTIMONIALS,
} from '@/lib/marketing/content'

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 bg-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-gold-500" />
            <span className="text-white text-sm font-medium">Trust &amp; credibility</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Built on verified members
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Every profile is checked before it can match. Here is what members get out of it.
          </p>
        </div>

        {/* Testimonials */}
        {!IS_TESTIMONIALS_PLACEHOLDER && (
          <div className="grid md:grid-cols-3 gap-6 mb-20">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.figure
              key={testimonial.quote}
              className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-2xl p-7 flex flex-col hover:border-gold-500/40 transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-1 mb-4" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((star) => (
                  <Star key={star} className="w-4 h-4 text-gold-500 fill-gold-500" />
                ))}
              </div>

              <Quote aria-hidden="true" className="w-7 h-7 text-gold-500/40 mb-3" />

              <blockquote className="text-gray-200 leading-relaxed mb-6 flex-1">
                “{testimonial.quote}”
              </blockquote>

              <figcaption className="flex items-center gap-3 border-t border-white/10 pt-5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {testimonial.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm truncate">
                    {testimonial.role}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {testimonial.organisation} · {testimonial.location}
                  </div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
        )}

        {/* Partners */}
        {!IS_PARTNERS_PLACEHOLDER && (
          <>
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                Our growing ecosystem
              </h3>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Funds, accelerators, trade bodies and founder communities working with
                AfroConnect to bring verified opportunity onto the platform.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {PARTNERS.map((partner, i) => (
            <motion.div
              key={partner.name}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center text-center hover:bg-white/10 hover:border-gold-500/40 transition-all grayscale hover:grayscale-0"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-900 font-bold mb-3">
                {partner.initials}
              </div>
              <div className="text-white text-xs font-semibold leading-tight mb-1">
                {partner.name}
              </div>
              <div className="text-gray-500 text-[11px] uppercase tracking-wide">
                {partner.category}
              </div>
            </motion.div>
          ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
