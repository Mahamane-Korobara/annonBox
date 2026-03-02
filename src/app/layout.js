import { Manrope } from 'next/font/google'
import PwaRegistrar from '@/components/pwa/PwaRegistrar'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://anonbox.sahelstack.tech'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ff4757',
}

export const metadata = {
  metadataBase: new URL(appUrl),
  applicationName: 'AnonBox',
  title: 'AnonBox - Recevez des messages anonymes',
  description:
    'Recevez des avis honnêtes, des confessions et des questions brûlantes de vos amis. 100% anonyme et sécurisé.',
  manifest: '/manifest.webmanifest',
  keywords: [
    'messages anonymes',
    'feedback anonyme',
    'questions anonymes',
    'anonbox',
    'ngl',
    'sendit',
  ],
  authors: [{ name: 'AnonBox' }],
  icons: {
    icon: [
      { url: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/pwa/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/pwa/icon-192.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AnonBox',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: appUrl,
    title: 'AnonBox - Recevez des messages anonymes',
    description:
      'Recevez des avis honnêtes, des confessions et des questions brûlantes de vos amis. 100% anonyme et sécurisé.',
    siteName: 'AnonBox',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnonBox - Recevez des messages anonymes',
    description:
      'Recevez des avis honnêtes, des confessions et des questions brûlantes de vos amis. 100% anonyme et sécurisé.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="light">
      <body className={`${manrope.variable} font-display antialiased`}>
        <PwaRegistrar />
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  )
}
