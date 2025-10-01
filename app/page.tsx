'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  Brain, 
  Zap,
  Smartphone,
  Play
} from 'lucide-react'
import { useAuth } from './providers/auth-provider'
import { ThemeToggle } from './components/theme-toggle'
import { PublicMobileMenu } from './components/public-mobile-menu'
import { getPublicServices } from './lib/integrations/constants'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/client'
import { ContactForm } from './components/contact-form'

const publicServicesCount = getPublicServices().length;

const demoVideos = [
  {
    id: "FmxwgpCW_7A",
    title: "Oura Stress Zones Research Email",
    thumbnail: "https://img.youtube.com/vi/FmxwgpCW_7A/maxresdefault.jpg"
  },
  {
    id: "3n_l7NohHrk",
    title: "Email Integration Flow",
    thumbnail: "https://img.youtube.com/vi/3n_l7NohHrk/maxresdefault.jpg"
  },
  {
    id: "vfv6uGq42DY",
    title: "Oura Integration + Wellness Dashboard",
    thumbnail: "https://img.youtube.com/vi/vfv6uGq42DY/maxresdefault.jpg"
  },
  {
    id: "quMsf4s5LFQ",
    title: "Juniper Asked About A Run",
    thumbnail: "https://img.youtube.com/vi/quMsf4s5LFQ/maxresdefault.jpg"
  },
  {
    id: "gEakiZ-NB-k",
    title: "Surgical History Inquiry",
    thumbnail: "https://img.youtube.com/vi/gEakiZ-NB-k/maxresdefault.jpg"
  }
]

const features = [
  {
    icon: Mic,
    title: "Wellness Focused",
    description: "Integrates with your wearables and medical records and takes a holistic, integrative approach to your health and wellness"
  },
  {
    icon: Smartphone,
    title: "Cross-Platform",
    description: "Available on iOS and Android with a suplemental web application for enhanced views and easier resource management"
  },
  {
    icon: Brain,
    title: "Smart Resource Management",
    description: "Intuitive storage of resources like memories and samples to help your AI do things like write emails in your tone or create personalized workoouts based on your health metrics"
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
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

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
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/blog" className="text-foreground hover:text-primary transition-colors">
                Blog
              </Link>
              <Link href="/integration-descriptions" className="text-foreground hover:text-primary transition-colors">
                Integrations
              </Link>
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
              <ThemeToggle />
            </div>
            <PublicMobileMenu user={user} loading={loading} />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-foreground mb-6">
          An AI Assistant for 
 
            <span style={{color: 'var(--muted-blue)'}}> Wellness and Productivity</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Add intelligence to your interactions with your wearable devices.
            Connect productivity services like Gmail, Slack, and Notion.
            Live well.
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

      {/* Demos Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">Demos</h3>
          <p className="text-lg text-muted-foreground">See Juniper in action</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {demoVideos.map((video) => (
            <div key={video.id} className="relative group">
              {playingVideo === video.id ? (
                <div className="relative overflow-hidden rounded-lg">
                  <iframe
                    width="100%"
                    height="250"
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-64 rounded-lg"
                  ></iframe>
                </div>
              ) : (
                <div 
                  className="relative cursor-pointer overflow-hidden rounded-lg group"
                  onClick={() => setPlayingVideo(video.id)}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-64 object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-lg"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 hover:bg-white rounded-full p-4 transition-all duration-200 group-hover:scale-110">
                      <Play className="w-6 h-6 text-gray-700 ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
              )}
              <h4 className="text-lg font-semibold text-foreground mt-4 text-center">{video.title}</h4>
            </div>
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
            {user ? 'Chat with Juniper or manage integrations and repository' : 'Create your account and start using Juniper today'}
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

      {/* Mobile Apps Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">Unlock Voice Options and Wearable Integrations</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Get the full Juniper experience with our mobile apps featuring voice interactions and seamless Pixel/Apple Watch integration
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="https://apps.apple.com/us/app/juniperai/id6749830751"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                <Smartphone className="mr-2 h-5 w-5" />
                Download on App Store
              </Button>
            </a>
            <Link href="/support">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                <Smartphone className="mr-2 h-5 w-5" />
                Google Play (Closed Testing)
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Google Play Store app available via Closed Testing - contact support for access
          </p>
        </div>
      </section>

      {/* Business Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <h3 className="text-3xl font-bold mb-4">Want Something Like Juniper for Your Business?</h3>
            <p className="text-lg text-muted-foreground">
              We can help you build custom AI-powered systems tailored to your specific needs. 
              Get in touch to discuss how we can transform your business with intelligent and reliable systems.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <ContactForm variant="business" />
          </div>
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
                Your intelligent mobile assistant for Wellness and Productivity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Quick Links</h4>
              <div className="space-y-2">
                <Link href="/integration-descriptions" className="block text-muted-foreground hover:text-foreground">
                  Integrations
                </Link>
                <Link href="/support" className="block text-muted-foreground hover:text-foreground">
                  Contact Support
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