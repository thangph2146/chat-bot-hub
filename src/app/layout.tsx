import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/QueryProvider'; // Adjust path if necessary

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HUB Chat Bot',
  description: 'Trợ lý ảo Đại học Ngân hàng TP.HCM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
