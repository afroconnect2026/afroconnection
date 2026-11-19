'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Check, Globe } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'inline'
  showIcon?: boolean
}

export default function LanguageSwitcher({
  variant = 'dropdown',
  showIcon = true
}: LanguageSwitcherProps) {
  const { language, setLanguage, languages, t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  const handleLanguageChange = async (langCode: 'en' | 'fr') => {
    if (langCode === language) return

    setIsLoading(true)
    try {
      await setLanguage(langCode)
      toast.success(
        langCode === 'en'
          ? 'Language changed to English'
          : 'Langue changée en Français'
      )
    } catch (error) {
      toast.error('Failed to change language')
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          {showIcon && <Globe className="h-4 w-4" />}
          <span>{t('settings.language.title')}</span>
        </div>
        <p className="text-sm text-gray-600">{t('settings.language.description')}</p>

        <div className="grid grid-cols-2 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={isLoading}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                language === lang.code
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{lang.name}</p>
                  <p className="text-xs text-gray-500">{lang.code.toUpperCase()}</p>
                </div>
              </div>

              {language === lang.code && (
                <Check className="h-5 w-5 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Dropdown variant (now side-by-side buttons)
  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 backdrop-blur-sm border border-white/20">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
            language === lang.code
              ? 'bg-gold-500 text-navy-900'
              : 'text-white hover:bg-white/10'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
