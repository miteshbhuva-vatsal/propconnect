import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'PropConnect — Real Estate Deal Network',
    template: '%s | PropConnect',
  },
  description: 'The secure, WhatsApp-inspired platform for real estate brokers, developers, and investors to exchange property information and close deals.',
  keywords: ['real estate', 'property deals', 'broker network', 'property listing', 'real estate CRM'],
  authors: [{ name: 'PropConnect' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://propconnect.app',
    siteName: 'PropConnect',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#075E54',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white text-wp-text antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#075E54',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#25D366', secondary: '#fff' } },
            error: { style: { background: '#ef4444' } },
          }}
        />
      </body>
    </html>
  )
}
