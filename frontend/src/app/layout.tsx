import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';

export const metadata: Metadata = {
  title: 'Impact Intelligence Platform',
  description: 'AI-Powered Visual Evidence Intelligence Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-primary-text min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
