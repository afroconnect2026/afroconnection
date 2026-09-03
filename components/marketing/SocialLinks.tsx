'use client'

import { Facebook, Instagram, Linkedin, Mail, Twitter } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CONTACT_EMAIL, SOCIAL_LINKS } from '@/lib/marketing/content'
import type { SocialLink } from '@/lib/marketing/content'

const iconMap: Record<SocialLink['icon'], LucideIcon> = {
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Mail,
}

interface SocialLinksProps {
  /** Visual treatment. `solid` suits dark footers, `ghost` suits light surfaces. */
  variant?: 'solid' | 'ghost'
  /** Show only the priority channel (LinkedIn). */
  primaryOnly?: boolean
  /** Append a mailto link for the contact address. */
  includeEmail?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export default function SocialLinks({
  variant = 'solid',
  primaryOnly = false,
  includeEmail = false,
  size = 'md',
  className = '',
}: SocialLinksProps) {
  const links: SocialLink[] = SOCIAL_LINKS.filter(
    (link) => link.href.trim().length > 0 && (!primaryOnly || link.primary)
  )

  if (includeEmail) {
    links.push({
      name: 'Email',
      href: `mailto:${CONTACT_EMAIL}`,
      icon: 'Mail',
      primary: false,
    })
  }

  if (links.length === 0) return null

  const box = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11'
  const glyph = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  const surface =
    variant === 'solid'
      ? 'bg-white/10 border-white/15 text-white hover:bg-gold-500 hover:text-navy-900 hover:border-gold-500'
      : 'bg-navy-900/5 border-navy-900/10 text-navy-900 hover:bg-navy-900 hover:text-white'

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {links.map((link) => {
        const Icon = iconMap[link.icon]
        const isMail = link.href.startsWith('mailto:')

        return (
          <a
            key={link.name}
            href={link.href}
            target={isMail ? undefined : '_blank'}
            rel={isMail ? undefined : 'noopener noreferrer'}
            aria-label={
              isMail ? `Email AfroConnect` : `AfroConnect on ${link.name} (opens in a new tab)`
            }
            title={isMail ? 'Email AfroConnect' : `AfroConnect on ${link.name}`}
            className={`${box} rounded-xl border flex items-center justify-center transition-all hover:scale-110 ${surface}`}
          >
            <Icon className={glyph} />
          </a>
        )
      })}
    </div>
  )
}
