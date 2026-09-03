import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Public Preview',
  description:
    'See AfroConnect before you sign up — live events, featured opportunities, anonymised investment deals and examples of the matches we make.',
  openGraph: {
    title: 'AfroConnect Public Preview',
    description:
      'Live events, featured opportunities and anonymised investment deals — no account required.',
    url: '/preview',
  },
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
