import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/AuthContext';
import { QueryProvider } from '@/lib/QueryProvider';
import { GoogleAuthWrapper } from '@/lib/GoogleAuthWrapper';
import ErrorBoundary from '@/components/ErrorBoundary';

// Load Inter via next/font — avoids external <link> tags that can fail CSP on Vercel
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AgriDrishti – Smart Farming System',
  description: 'Real-time IoT farm monitoring dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
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
                  background: '#1a5c2a',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                },
                success: {
                  iconTheme: { primary: '#3dba6f', secondary: '#fff' },
                },
                error: {
                  style: { background: '#b91c1c' },
                },
              }}
            />
          </AuthProvider>
          </GoogleAuthWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}

