'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  Phone, 
  Brain, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Users, 
  Video, 
  Cloud,
  CheckCircle,
  Zap,
  Smartphone
} from 'lucide-react'
import Link from 'next/link'

const integrations = [
  { name: "Notion", category: "Project Management", icon: FileText, color: "bg-black" },
  { name: "Slack", category: "Team Communication", icon: MessageSquare, color: "bg-purple-600" },
  { name: "Trello", category: "Project Management", icon: Users, color: "bg-blue-600" },
  { name: "Zoom", category: "Video Conferencing", icon: Video, color: "bg-blue-500" },
  { name: "Dropbox", category: "Cloud Storage", icon: Cloud, color: "bg-blue-400" },
  { name: "Todoist", category: "Task Management", icon: CheckCircle, color: "bg-red-500" },
  { name: "Perplexity", category: "AI Research", icon: Brain, color: "bg-indigo-600" },
  { name: "Google Sheets", category: "Spreadsheets", icon: FileText, color: "bg-green-600" },
  { name: "Google Docs", category: "Documents", icon: FileText, color: "bg-blue-600" },
  { name: "Gmail", category: "Email", icon: MessageSquare, color: "bg-red-600" },
  { name: "Google Calendar", category: "Calendar", icon: Calendar, color: "bg-blue-500" },
  { name: "Microsoft Excel", category: "Spreadsheets", icon: FileText, color: "bg-green-700" },
  { name: "Microsoft Word", category: "Documents", icon: FileText, color: "bg-blue-700" },
  { name: "Outlook Calendar", category: "Calendar", icon: Calendar, color: "bg-blue-600" },
  { name: "Outlook Mail", category: "Email", icon: MessageSquare, color: "bg-blue-600" },
  { name: "Microsoft Teams", category: "Communication", icon: Users, color: "bg-purple-700" },
  { name: "Google Meet", category: "Video Conferencing", icon: Video, color: "bg-green-500" },
  { name: "Twilio", category: "SMS", icon: Phone, color: "bg-red-500" }
]

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
    title: "Smart Memory Management",
    description: "Intelligent or manual memory management to optimize your workflow"
  },
  {
    icon: Zap,
    title: "Instant Integrations",
    description: "Connect to 18+ services with seamless authentication and setup"
  }
]

export default function HomePage() {
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
            <Link href="/integrations">
              <Button variant="outline">View Integrations</Button>
            </Link>
            <Link href="/integration/setup">
              <Button>Get Started</Button>
            </Link>
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
            Juniper integrates seamlessly with 18+ platforms to streamline your workflow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/integration/setup">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Your Setup
              </Button>
            </Link>
            <Link href="/integrations">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Explore Integrations
              </Button>
            </Link>
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

      {/* Integrations Preview */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">18+ Integrations</h3>
          <p className="text-lg text-gray-600">Connect with all your essential tools and services</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {integrations.map((integration, index) => (
            <Card key={index} className="p-4 text-center border-0 shadow-md hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <integration.icon className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-sm text-gray-900 mb-1">{integration.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {integration.category}
              </Badge>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Link href="/integrations">
            <Button variant="outline" size="lg">
              View All Integrations
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 text-blue-100">
            Set up your first integration in minutes and experience the power of Juniper
          </p>
          <Link href="/integration/setup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Configure Your First Integration
            </Button>
          </Link>
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
                <Link href="/integration/setup" className="block text-gray-400 hover:text-white">
                  Setup Guide
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
