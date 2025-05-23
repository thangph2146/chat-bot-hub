import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/QueryProvider'; // Adjust path if necessary
import ReduxProvider from '@/components/ReduxProvider';   // Adjust path if necessary
import logger from '@/lib/logger';

const inter = Inter({ subsets: ['latin'] });
const COMPONENT_NAME = 'RootLayout';

export const metadata: Metadata = {
  title: 'HUB Chat Bot',
  description: 'Trợ lý ảo Đại học Ngân hàng TP.HCM',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  logger.info(COMPONENT_NAME, 'Rendering RootLayout.');
  return (
    <html lang="vi">
      <body className={inter.className}>
        <ReduxProvider> {/* Ensure ReduxProvider is here */}
          <QueryProvider>
            {children}
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
