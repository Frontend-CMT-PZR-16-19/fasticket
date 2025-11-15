import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
<<<<<<< HEAD
import { Header } from "@/components/header";
=======
import { AuthProvider } from "@/components/providers/auth-provider";
import { MainNavigation } from "@/components/main-navigation";
>>>>>>> 63d7dc20f9ad50b68d6e814423e7fb227884ef3e
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
<<<<<<< HEAD
          <Header />
          {children}
          <Toaster />
=======
          <AuthProvider>
            <MainNavigation />
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster />
          </AuthProvider>
>>>>>>> 63d7dc20f9ad50b68d6e814423e7fb227884ef3e
        </ThemeProvider>
      </body>
    </html>
  );
}
