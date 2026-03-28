import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Image Binarizer Pro',
  description: 'High performance image binarization and color replacement tool',
}

export const viewport = {
  themeColor: '#4f46e5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ユーザー要件によりダークテーマを強制
  return (
    <html lang="ja" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  )
}
