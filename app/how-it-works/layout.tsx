import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works | AfroConnect',
  description: 'Learn how AfroConnect connects entrepreneurs, investors, and professionals across Africa. From sign up to signed deal in five steps.',
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children
}
