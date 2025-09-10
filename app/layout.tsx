
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/sidebar.css';
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ subsets: ['latin'] });
// Force fresh deployment - cache bust

export const metadata: Metadata = {
  title: 'AI BlogWriter Pro - Intelligent Content Creation',
  description: 'Create high-quality blog content with AI-powered keyword research, clustering, and content generation tools.',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
  themeColor: '#7C3AED',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <CustomThemeProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
