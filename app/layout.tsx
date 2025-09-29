import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MindJungle',
  description:
    'MindJungle is a local-first PKM workspace for turning ideas into outlines and publishable papers.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-jungle-900 text-jungle-50">{children}</div>
      </body>
    </html>
  );
}
