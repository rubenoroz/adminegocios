import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ADMNegocios | Sistema de Administración de Negocios",
  description: "Plataforma integral para administrar escuelas, academias, tiendas y restaurantes en un solo lugar.",
  icons: {
    icon: "/favicon.svg",
    apple: "/imago.svg",
  },
};

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'es' },
    { lang: 'fr' },
    { lang: 'de' },
    { lang: 'it' },
    { lang: 'pt' },
    { lang: 'zh' },
    { lang: 'ja' },
  ];
}

import { AuthProvider } from "@/components/auth-provider";
import { BrandingProvider } from "@/context/branding-context";
import { Toaster } from "@/components/ui/toaster";

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={cn(inter.variable, "min-h-screen font-sans antialiased")} style={{ backgroundColor: '#ffffff' }}>
        <AuthProvider>
          <BrandingProvider>
            {children}
            <Toaster />
          </BrandingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
