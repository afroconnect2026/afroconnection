'use client'

import Link from 'next/link'
import { Mail } from 'lucide-react'
import SocialLinks from './SocialLinks'
import { CONTACT_EMAIL } from '@/lib/marketing/content'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function PublicFooter() {
  const { t } = useTranslation()
  return (
    <footer className="bg-navy-900 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <img
                src="/logo-afroconnect.png"
                alt="AfroConnect"
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {t('footer.connectingAfricaToOpportunity')}. {t('home.platformFocus')} — {t('footer.inOneNetwork')}.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gold-500 transition-colors text-sm"
            >
              <Mail className="w-4 h-4" />
              {CONTACT_EMAIL}
            </a>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.platform')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#how-it-works" className="text-gray-400 hover:text-gold-500 transition-colors">
                  {t('footer.howItWorks')}
                </Link>
              </li>
              <li>
                <Link href="/preview" className="text-gray-400 hover:text-gold-500 transition-colors">
                  {t('footer.publicPreview')}
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-400 hover:text-gold-500 transition-colors">
                  {t('footer.events')}
                </Link>
              </li>
              <li>
                <Link href="/#ai" className="text-gray-400 hover:text-gold-500 transition-colors">
                  {t('footer.whatOurAIDoes')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-gold-500 transition-colors">
                  {t('footer.aboutAndTeam')}
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-gold-500 transition-colors">
                  {t('footer.support')}
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-gray-400 hover:text-gold-500 transition-colors">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-gray-400 hover:text-gold-500 transition-colors">
                  {t('footer.termsOfService')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.getStarted')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/auth/register?role=investor"
                  className="text-gray-400 hover:text-gold-500 transition-colors"
                >
                  {t('footer.imAnInvestor')}
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register?role=founder"
                  className="text-gray-400 hover:text-gold-500 transition-colors"
                >
                  {t('footer.imAFounder')}
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register?role=opportunities"
                  className="text-gray-400 hover:text-gold-500 transition-colors"
                >
                  {t('footer.imLookingForOpportunities')}
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register?role=funding"
                  className="text-gray-400 hover:text-gold-500 transition-colors"
                >
                  {t('footer.imLookingForFunding')}
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-gray-400 hover:text-gold-500 transition-colors">
                  {t('footer.signIn')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-400 text-sm order-2 md:order-1">
            © {new Date().getFullYear()} AfroConnect. {t('footer.allRightsReserved')}.
          </p>
          <div className="order-1 md:order-2 flex flex-col sm:flex-row items-center gap-3">
            <span className="text-gray-500 text-sm">{t('footer.followUs')}</span>
            <SocialLinks size="sm" />
          </div>
        </div>
      </div>
    </footer>
  )
}
