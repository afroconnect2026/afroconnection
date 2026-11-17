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
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLanguageChange = async (langCode: 'en' | 'fr') => {
    if (langCode === language) {
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      await setLanguage(langCode)
      toast.success(
        langCode === 'en'
          ? 'Language changed to English'
          : 'Langue changée en Français'
      )
      setIsOpen(false)
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

  // Dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
      >
        {showIcon && <Globe className="h-4 w-4 text-gray-600" />}
        <span className="text-sm font-medium text-gray-900">
          {languages.find(l => l.code === language)?.flag}
        </span>
        <span className="text-sm text-gray-700">
          {language.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-gray-200 shadow-lg z-20 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isLoading}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  language === lang.code ? 'bg-primary-50' : ''
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{lang.flag}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lang.name}</p>
                    <p className="text-xs text-gray-500">{lang.code.toUpperCase()}</p>
                  </div>
                </div>

                {language === lang.code && (
                  <Check className="h-4 w-4 text-primary-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
