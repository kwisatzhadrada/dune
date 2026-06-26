export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DreamLink – Network for Ambitious Builders',
  description: 'Where founders share the real journey. Connect with ambitious people solving the same problems.',
  keywords: ['networking', 'founders', 'startups', 'entrepreneurs', 'mentorship'],
  openGraph: {
    title: 'DreamLink',
    description: 'Where founders share the real journey.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-TZG9YF5V2Q" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-TZG9YF5V2Q');` }} />
      </head>
      <body className="min-h-screen bg-[#08081C] text-[#EDEAF8] antialiased">
        {children}
      </body>
    </html>
  )
}
