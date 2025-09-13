import '../styles/globals.css';
import React from 'react';
export const metadata = { title: 'Test Prep Beta', description: 'Tolendi Test Prep — Beta v1.0' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="min-h-screen bg-white text-gray-900">{children}</body></html>);
}
