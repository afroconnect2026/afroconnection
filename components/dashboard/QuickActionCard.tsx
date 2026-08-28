import Link from 'next/link'
import { LucideIcon, ArrowRight } from 'lucide-react'

interface QuickActionCardProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
  color: string
}

export default function QuickActionCard({ title, description, href, icon: Icon, color }: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 transition-all hover:shadow-xl"
    >
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-primary-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="flex items-center text-primary-600 text-sm font-medium">
        Get started
        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}
