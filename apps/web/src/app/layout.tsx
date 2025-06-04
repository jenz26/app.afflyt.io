import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Afflyt.io - Trasforma i tuoi link affiliati in una macchina di conversione',
  description: 'Piattaforma SaaS completa per affiliate marketing con automazione multi-canale e analytics avanzati.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}