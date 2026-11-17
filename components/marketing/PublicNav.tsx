'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import SocialLinks from './SocialLinks'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from '@/lib/i18n/LanguageContext'

const navItems: { label: string; labelKey?: string; href: string }[] = [
  { label: 'Home', labelKey: 'nav.home', href: '/' },
  { label: 'How It Works', labelKey: 'nav.howItWorks', href: '/how-it-works' },
  { label: 'Explore', labelKey: 'nav.explore', href: '/explore' },
  { label: 'Events', labelKey: 'nav.events', href: '/events/browse' },
  { label: 'About', labelKey: 'nav.about', href: '/about' },
]

interface PublicNavProps {
  /** Highlights the current page in the nav. */
  active?: string
}

export default function PublicNav({ active }: PublicNavProps) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 shrink-0">
            <img
              src="/logo-afroconnect.png"
              alt="AfroConnect"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  active === item.href
                    ? 'text-gold-400'
                    : 'text-gray-200 hover:text-gold-400'
                }`}
              >
                {item.labelKey ? t(item.labelKey) : item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:block">
              <LanguageSwitcher variant="dropdown" showIcon />
            </div>
            <div className="hidden xl:block">
              <SocialLinks primaryOnly size="sm" />
            </div>
            <Link
              href="/auth/login"
              className="text-white hover:text-gold-400 transition-colors text-sm sm:text-base font-medium px-2 py-2"
            >
              {t('auth.signIn')}
            </Link>
            <Link
              href="/auth/register"
              className="hidden sm:inline-flex bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold hover:shadow-xl hover:shadow-gold-500/60 hover:scale-105 transition-all text-sm sm:text-base shadow-lg"
            >
              {t('auth.getStarted')}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-white/10 bg-navy-900/95 backdrop-blur-lg px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-3 rounded-lg text-gray-200 hover:text-gold-400 hover:bg-white/5 transition-colors font-medium"
            >
              {item.labelKey ? t(item.labelKey) : item.label}
            </Link>
          ))}
          <Link
            href="/auth/register"
            onClick={() => setOpen(false)}
            className="block text-center bg-gradient-to-r from-gold-400 to-gold-500 text-navy-900 px-6 py-3 rounded-lg font-bold mt-3"
          >
            {t('auth.getStarted')}
          </Link>
          <div className="pt-4 space-y-3">
            <div className="pb-3 border-b border-white/10">
              <p className="text-xs text-gray-400 mb-2 px-3">Language</p>
              <LanguageSwitcher variant="inline" showIcon={false} />
            </div>
            <SocialLinks size="sm" />
          </div>
        </div>
      )}
    </nav>
  )
}
