import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReportAndFix | Report today. A better tomorrow.',
  description: 'A transparent campus issue reporting and resolution platform.',
  generator: 'ReportAndFix',
  icons: { icon: '/report-and-fix-logo.png', apple: '/report-and-fix-logo.png' },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0d2b52',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
