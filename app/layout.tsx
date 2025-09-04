import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers/auth-provider";
import { ThemeProvider } from "./providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Juniper: An AI Assistant for Wellness and Productivity",
    template: "%s | Juniper"
  },
  description: "Connect all your favorite apps and services with voice-controlled intelligence. Juniper integrates seamlessly with over a dozen platforms to streamline your workflow.",
  keywords: ["mobile assistant", "AI", "integrations", "voice control", "productivity", "automation"],
  authors: [{ name: "Juniper Team" }],
  openGraph: {
    title: "Juniper: An AI Assistant for Wellness and Productivity",
    description: "Connect all your favorite apps and services with voice-controlled intelligence.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Juniper: An AI Assistant for Wellness and Productivity",
    description: "Connect all your favorite apps and services with voice-controlled intelligence.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          defaultMode="light"
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
