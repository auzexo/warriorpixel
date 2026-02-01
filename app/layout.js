// app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'WarriorPixel - Gaming Community Platform',
  description: 'Join tournaments, earn rewards, and connect with gamers worldwide',
  keywords: 'gaming, tournaments, free fire, bgmi, stumble guys, minecraft, esports, rewards',
  authors: [{ name: 'WarriorPixel Team' }],
  openGraph: {
    title: 'WarriorPixel - Gaming Community Platform',
    description: 'Join tournaments, earn rewards, and connect with gamers worldwide',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
