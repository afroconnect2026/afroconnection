import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  textColor?: string
  className?: string
}

const sizeMap = {
  sm: { img: 32, text: 'text-lg' },
  md: { img: 40, text: 'text-xl' },
  lg: { img: 48, text: 'text-2xl' }
}

export default function Logo({
  href = '/dashboard',
  size = 'md',
  showText = true,
  textColor = 'text-navy-900',
  className = ''
}: LogoProps) {
  const { img, text } = sizeMap[size]

  const LogoContent = () => (
    <div className={`flex items-center ${className}`}>
      <img
        src="/logo-afroconnect.png"
        alt="AfroConnect Logo"
        className="h-12 w-auto object-contain"
      />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}
