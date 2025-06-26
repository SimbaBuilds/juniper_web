import type { Metadata } from "next";
import Link from "next/link";
import { Brain, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Integration Setup",
  description: "Configure your integrations with Mobile Jarvis to connect your favorite apps and services.",
};

export default function IntegrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Mobile Jarvis</span>
              </div>
            </div>
            <Link href="/integrations">
              <Button variant="outline">View All Integrations</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>Need help? <Link href="/" className="text-blue-600 hover:underline">Contact support</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
} 