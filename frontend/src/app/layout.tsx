import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/AuthContext';
import { QueryProvider } from '@/lib/QueryProvider';
import { GoogleAuthWrapper } from '@/lib/GoogleAuthWrapper';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';

// Load Inter via next/font — avoids external <link> tags that can fail CSP on Vercel
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'PrithviCore – Smart Farming System',
  description: 'Real-time IoT farm monitoring dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <GoogleAuthWrapper>
            <AuthProvider>
              <ErrorBoundary>
              {children}
              </ErrorBoundary>

              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'var(--primary)',
                    color: '#fff',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  },
                  success: {
                    iconTheme: { primary: '#fff', secondary: 'var(--primary)' },
                  },
                  error: {
                    style: { background: '#b91c1c', color: '#fff' },
                  },
                }}
              />
            </AuthProvider>
            </GoogleAuthWrapper>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

