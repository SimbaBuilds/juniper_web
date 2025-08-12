'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  Brain, 
  Zap,
  Smartphone
} from 'lucide-react'
import { useAuth } from './providers/auth-provider'
import { ThemeToggle } from './components/theme-toggle'
import { PublicMobileMenu } from './components/public-mobile-menu'
import { getPublicServices } from './lib/integrations/constants'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/client'

const publicServicesCount = getPublicServices().length;

const features = [
  {
    icon: Mic,
    title: "Chat Focused Processing",
    description: "Control Juniper's behavior, complete integrations, and manage automations all through text and voice chat"
  },
  {
    icon: Smartphone,
    title: "Cross-Platform",
    description: "Available on iOS and Android with a suplemental web application for enhanced views and easier resource management"
  },
  {
    icon: Brain,
    title: "Smart Resource Management",
    description: "Intuitive Storage of resources like memories and samples to help your AI do things like write emails in your tone or create personalized workoouts based on your health metrics"
  },
  {
    icon: Zap,
    title: `${publicServicesCount}+ Integrations`,
    description: "Connect with services like Oura, Gmail, Slack, and Notion"
  }
]

export default function HomePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if there's a hash in the URL (mobile app callback)
    const handleHashCallback = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        try {
          // Parse the hash parameters
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const type = params.get('type')

          if (accessToken && refreshToken) {
            // Set the session with the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })

            if (!error) {
              // Clear the hash from the URL
              window.history.replaceState(null, '', window.location.pathname)
              
              // Handle different flow types
              if (type === 'recovery') {
                router.push('/update-password')
              } else {
                router.push('/dashboard')
              }
            }
          }
        } catch (err) {
          console.error('Error handling auth callback:', err)
        }
      }
    }

    handleHashCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8" style={{color: 'var(--muted-blue)'}} />
            <Link href="/" className="text-2xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer">Juniper</Link>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center space-x-4">
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : user ? (
                <>
                  <span className="text-foreground">{user.email}</span>
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
            <PublicMobileMenu user={user} loading={loading} signOut={signOut} />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-foreground mb-6">
          An AI Personal Assistant with a 
 
            <span style={{color: 'var(--muted-blue)'}}> Health and Wellness Focus</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
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
                    Get Started
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
          <h3 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h3>
          <p className="text-lg text-muted-foreground">Experience the future of mobile productivity</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border border-border shadow-lg bg-muted">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Integrations Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">Explore Our Integrations</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Connect Juniper with your favorite apps and services
          </p>
          <Link href="/integration-descriptions">
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              View Integrations
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 text-primary-foreground/80">
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
      <footer className="bg-background border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">Juniper</span>
              </div>
              <p className="text-muted-foreground">
                Your intelligent mobile assistant for seamless app integration and voice-controlled productivity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/integration-descriptions" className="block text-muted-foreground hover:text-foreground">
                  Integrations
                </Link>
                <Link href="/privacy-policy" className="block text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-use" className="block text-muted-foreground hover:text-foreground">
                  Terms of Use
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Platform Support</h4>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>iOS & Android</span>
              </div>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 Juniper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}