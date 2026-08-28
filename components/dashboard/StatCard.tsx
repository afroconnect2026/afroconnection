import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  name: string
  value: string | number
  icon: LucideIcon
  color: string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function StatCard({ name, value, icon: Icon, color, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-8 w-8 ${color}`} />
        {trend && (
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-navy-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{name}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}
