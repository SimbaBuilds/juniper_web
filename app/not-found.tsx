import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Brain, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Brain className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Page Not Found</h2>
          <p className="text-gray-600">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </Button>
          </Link>
          <Link href="/integrations">
            <Button variant="outline" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Browse Integrations</span>
            </Button>
          </Link>
        </div>

        {/* Brand */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            © 2024 Mobile Jarvis. Your AI-Powered Mobile Assistant.
          </p>
        </div>
      </div>
    </div>
  )
} 