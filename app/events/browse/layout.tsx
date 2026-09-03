import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events | AfroConnect',
  description: 'Roundtables, clinics and summits where African entrepreneurs, investors and professionals meet in person and online.',
}

export default function EventsBrowseLayout({ children }: { children: React.ReactNode }) {
  return children
}
