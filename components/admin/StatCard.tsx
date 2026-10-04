import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  subtitle: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange'
  trend?: string
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend
}: StatCardProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-sm font-medium text-green-600">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {value?.toLocaleString()}
        </p>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>
    </div>
  )
}
