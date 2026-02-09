import './globals.css'
import { Inter } from 'next/font/google'
import ClientLayout from '@/components/layout/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'WarriorPixel - Gaming Platform',
  description: 'India\'s Premier Gaming Tournament Platform - Play, Compete, Win!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
