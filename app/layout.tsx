import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Club4 Premium CRM',
  description: 'CRM comercial do Club4 Premium',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
