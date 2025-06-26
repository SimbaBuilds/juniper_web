import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: "Mobile Jarvis - AI-Powered Mobile Assistant",
    template: "%s | Mobile Jarvis"
  },
  description: "Connect all your favorite apps and services with voice-controlled intelligence. Mobile Jarvis integrates seamlessly with 18+ platforms to streamline your workflow.",
  keywords: ["mobile assistant", "AI", "integrations", "voice control", "productivity", "automation"],
  authors: [{ name: "Mobile Jarvis Team" }],
  openGraph: {
    title: "Mobile Jarvis - AI-Powered Mobile Assistant",
    description: "Connect all your favorite apps and services with voice-controlled intelligence.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobile Jarvis - AI-Powered Mobile Assistant",
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
        {children}
      </body>
    </html>
  );
}
