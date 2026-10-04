import { CheckCircle } from 'lucide-react'

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function VerifiedBadge({ size = 'md', className = '' }: VerifiedBadgeProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      title="Verified Account"
    >
      <CheckCircle className={`${sizes[size]} text-blue-600 fill-blue-100`} />
    </div>
  )
}
