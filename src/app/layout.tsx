import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'BarBerTok | Премиальный барбершоп и ИИ-стилист',
  description: 'Примерьте новый образ с помощью ИИ и запишитесь к лучшим барберам города. Будущее мужского стиля уже здесь.',
  openGraph: {
    title: 'BarBerTok | Ваш идеальный стиль',
    description: 'ИИ-визуализация причесок и онлайн-запись в современный барбершоп.',
    images: ['https://images.unsplash.com/photo-1635273051839-003bf06a8751?q=80&w=1200'],
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-accent selection:text-accent-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
