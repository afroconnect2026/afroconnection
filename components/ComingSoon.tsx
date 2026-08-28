import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface ComingSoonProps {
  icon: LucideIcon
  title: string
  description: string
  features?: string[]
}

export default function ComingSoon({ icon: Icon, title, description, features }: ComingSoonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto text-center py-16"
    >
      <div className="bg-gradient-to-br from-primary-100 to-gold-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="h-12 w-12 text-primary-600" />
      </div>

      <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-4">
        {title}
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        {description}
      </p>

      {features && features.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 max-w-2xl mx-auto">
          <h3 className="font-semibold text-navy-900 mb-4">Coming Features:</h3>
          <ul className="space-y-2 text-left">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <div className="inline-flex items-center space-x-2 bg-gold-50 text-gold-700 px-4 py-2 rounded-lg text-sm font-medium">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-500"></span>
          </span>
          <span>Phase 2 - In Development</span>
        </div>
      </div>
    </motion.div>
  )
}
