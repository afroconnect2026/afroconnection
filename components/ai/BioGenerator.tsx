'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface BioGeneratorProps {
  currentBio: string
  userType: string
  industry?: string
  onBioGenerated: (newBio: string) => void
}

export default function BioGenerator({
  currentBio,
  userType,
  industry,
  onBioGenerated
}: BioGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [generatedBio, setGeneratedBio] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleGenerate = async () => {
    if (!currentBio || currentBio.trim().length < 10) {
      toast.error('Please write at least 10 characters in your bio first')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentBio,
          userType,
          industry
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate bio')
      }

      setGeneratedBio(data.enhancedBio)
      setShowPreview(true)
      toast.success('AI-enhanced bio ready!')

    } catch (error: any) {
      console.error('Bio generation error:', error)
      toast.error(error.message || 'Failed to generate bio')
    } finally {
      setGenerating(false)
    }
  }

  const handleAccept = () => {
    if (generatedBio) {
      onBioGenerated(generatedBio)
      setShowPreview(false)
      toast.success('Bio updated!')
    }
  }

  const handleReject = () => {
    setGeneratedBio(null)
    setShowPreview(false)
  }

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      {!showPreview && (
        <button
          onClick={handleGenerate}
          disabled={generating || !currentBio || currentBio.length < 10}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enhancing with AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Enhance Bio with AI</span>
            </>
          )}
        </button>
      )}

      {/* Preview */}
      <AnimatePresence>
        {showPreview && generatedBio && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-navy-900">AI-Enhanced Bio</h3>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <p className="text-gray-700 leading-relaxed">{generatedBio}</p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleReject}
                className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleAccept}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                <Check className="h-4 w-4" />
                <span>Use This Bio</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Text */}
      {!showPreview && (
        <p className="text-sm text-gray-500 flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span>AI will enhance your bio to be more professional and compelling</span>
        </p>
      )}
    </div>
  )
}
