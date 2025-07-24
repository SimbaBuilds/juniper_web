'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  Brain, 
  Zap,
  Smartphone
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from './providers/auth-provider'


const features = [
  {
    icon: Mic,
    title: "Voice-to-Voice Chat",
    description: "Hands-free conversation and configuration with natural voice commands"
  },
  {
    icon: Smartphone,
    title: "Cross-Platform Mobile",
    description: "Available cross platform with Android featuring always-on wake word detection"
  },
  {
    icon: Brain,
    title: "Smart Resource Management",
    description: "Intuitive Storage of Memories and Resources to help your AI serve you"
  },
  {
    icon: Zap,
    title: "12+ Integrations",
    description: "Connect to multiple services with seamless authentication and setup"
  }
]

export default function HomePage() {
  const { user, loading, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Juniper</h1>
          </div>
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : user ? (
              <>
                <span className="text-gray-700">{user.email}</span>
                <Link href="/dashboard">
                  <Button variant="outline">Dashboard</Button>
                </Link>
                <Button variant="ghost" onClick={signOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Your AI-Powered 
            <span className="text-blue-600"> Mobile Assistant</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect all your favorite apps and services with voice-controlled intelligence. 
            Juniper integrates seamlessly with multiple platforms to streamline your workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-3">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg" className="text-lg px-8 py-3">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h3>
          <p className="text-lg text-gray-600">Experience the future of mobile productivity</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Integrations Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Explore Our Integrations</h3>
          <p className="text-lg text-gray-600 mb-8">
            Connect Juniper with your favorite apps and services
          </p>
          <Link href="/integrations">
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              View Integrations
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 text-blue-100">
            {user ? 'Access your dashboard and manage your automations' : 'Create your account and start using Juniper today'}
          </p>
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                Sign Up Now
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">Juniper</span>
              </div>
              <p className="text-gray-400">
                Your intelligent mobile assistant for seamless app integration and voice-controlled productivity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/integrations" className="block text-gray-400 hover:text-white">
                  Integrations
                </Link>
                <Link href="/privacy-policy" className="block text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-use" className="block text-gray-400 hover:text-white">
                  Terms of Use
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform Support</h4>
              <div className="flex items-center space-x-2 text-gray-400">
                <Smartphone className="h-4 w-4" />
                <span>iOS & Android</span>
              </div>
            </div>
          </div>
          <Separator className="my-8 bg-gray-800" />
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Juniper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
