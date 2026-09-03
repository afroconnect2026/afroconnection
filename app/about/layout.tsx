import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About & Meet the Team',
  description:
    'AfroConnect’s vision, mission, story and the team building the trusted network layer for African opportunity — networking, investment, mentorship and business partnerships.',
  openGraph: {
    title: 'About AfroConnect — Meet the Team',
    description:
      'Our vision, mission, story and values, plus the founders building AfroConnect.',
    url: '/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
