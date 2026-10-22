import type { Metadata } from 'next';
import './globals.css';
import './sdr.css';

export const metadata: Metadata = {
  title: 'Club4 Premium CRM',
  description: 'CRM comercial do Club4 Premium',
  icons: {
    icon: '/brand/club4-vertical.svg',
    shortcut: '/brand/club4-vertical.svg',
    apple: '/brand/club4-vertical.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
