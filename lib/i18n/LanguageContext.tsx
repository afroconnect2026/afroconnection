'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import en from './locales/en.json'
import fr from './locales/fr.json'

export type Language = 'en' | 'fr'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
  languages: { code: Language; name: string; flag: string }[]
}

const translations = { en, fr }

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
]

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Load language preference on mount
  useEffect(() => {
    async function loadLanguagePreference() {
      try {
        // Priority 1: Check if user is logged in and has saved preference in database
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', user.id)
            .single()

          if (profile?.language && (profile.language === 'en' || profile.language === 'fr')) {
            setLanguageState(profile.language)
            setIsLoading(false)
            return
          }
        }

        // Priority 2: Check localStorage (for returning visitors who manually switched)
        const savedLang = localStorage.getItem('preferred-language')
        if (savedLang === 'en' || savedLang === 'fr') {
          setLanguageState(savedLang)
          setIsLoading(false)
          return
        }

        // Priority 3: Auto-detect from browser/phone language
        const browserLang = navigator.language.toLowerCase()
        console.log('🌍 Browser language detected:', browserLang)

        if (browserLang.startsWith('fr')) {
          console.log('✅ Setting language to French based on browser')
          setLanguageState('fr')
        } else {
          console.log('✅ Setting language to English (default)')
          setLanguageState('en')
        }
      } catch (error) {
        console.error('Error loading language preference:', error)
        setLanguageState('en')
      } finally {
        setIsLoading(false)
      }
    }

    loadLanguagePreference()
  }, [supabase])

  // Save language preference to user profile
  const setLanguage = async (lang: Language) => {
    setLanguageState(lang)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({ language: lang })
          .eq('id', user.id)
      }

      // Also save to localStorage for non-logged-in users
      localStorage.setItem('preferred-language', lang)
    } catch (error) {
      console.error('Error saving language preference:', error)
    }
  }

  // Translation function with nested key support
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.')
    let value: any = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fall back to English if translation not found
        value = translations.en
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2]
          } else {
            console.warn(`Translation missing for key: ${key}`)
            return key
          }
        }
        break
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key ${key} does not point to a string`)
      return key
    }

    // Replace parameters in translation
    if (params) {
      return Object.keys(params).reduce((str, paramKey) => {
        return str.replace(new RegExp(`{${paramKey}}`, 'g'), String(params[paramKey]))
      }, value)
    }

    return value
  }

  if (isLoading) {
    return null // Or a loading spinner
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Convenience hook for just the translation function
export function useTranslation() {
  const { t } = useLanguage()
  return { t }
}
