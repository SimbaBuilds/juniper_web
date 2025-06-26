'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Brain, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Users, 
  Video, 
  Cloud,
  CheckCircle,
  Phone,
  Search,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const integrations = [
  { 
    name: "Notion", 
    category: "Project Management", 
    icon: FileText, 
    color: "bg-black",
    description: "Organize your projects, tasks, and team collaboration in one workspace",
    features: ["Project Management", "Task Management", "Team Collaboration", "Documentation"]
  },
  { 
    name: "Slack", 
    category: "Team Communication", 
    icon: MessageSquare, 
    color: "bg-purple-600",
    description: "Connect with your team through channels, direct messages, and integrations",
    features: ["Team Communication", "Channel Management", "File Sharing", "Notifications"]
  },
  { 
    name: "Trello", 
    category: "Project Management", 
    icon: Users, 
    color: "bg-blue-600",
    description: "Visual project management with boards, lists, and cards",
    features: ["Project Management", "Task Management", "Team Collaboration", "Visual Organization"]
  },
  { 
    name: "Zoom", 
    category: "Video Conferencing", 
    icon: Video, 
    color: "bg-blue-500",
    description: "High-quality video meetings and webinars for remote collaboration",
    features: ["Video Conferencing", "Screen Sharing", "Recording", "Webinars"]
  },
  { 
    name: "Dropbox", 
    category: "Cloud Storage", 
    icon: Cloud, 
    color: "bg-blue-400",
    description: "Secure cloud storage and file synchronization across devices",
    features: ["Cloud Storage", "File Sync", "File Sharing", "Version Control"]
  },
  { 
    name: "Todoist", 
    category: "Task Management", 
    icon: CheckCircle, 
    color: "bg-red-500",
    description: "Smart task scheduling with reminders and project organization",
    features: ["Task Scheduling", "Reminders", "Task Management", "Project Organization"]
  },
  { 
    name: "Perplexity", 
    category: "AI Research", 
    icon: Brain, 
    color: "bg-indigo-600",
    description: "AI-powered search and research assistant for finding accurate information",
    features: ["Search", "AI Research", "Information Discovery", "Content Generation"]
  },
  { 
    name: "Google Sheets", 
    category: "Spreadsheets", 
    icon: FileText, 
    color: "bg-green-600",
    description: "Collaborative spreadsheets with real-time editing and data analysis",
    features: ["Cloud Spreadsheets", "Data Analysis", "Collaboration", "Formulas"]
  },
  { 
    name: "Google Docs", 
    category: "Documents", 
    icon: FileText, 
    color: "bg-blue-600",
    description: "Create and edit documents collaboratively in the cloud",
    features: ["Cloud Documents", "Real-time Collaboration", "Version History", "Comments"]
  },
  { 
    name: "Gmail", 
    category: "Email", 
    icon: MessageSquare, 
    color: "bg-red-600",
    description: "Powerful email management with smart filtering and organization",
    features: ["Email Management", "Smart Filters", "Labels", "Search"]
  },
  { 
    name: "Google Calendar", 
    category: "Calendar", 
    icon: Calendar, 
    color: "bg-blue-500",
    description: "Schedule management with smart suggestions and event coordination",
    features: ["Calendar Management", "Event Scheduling", "Reminders", "Integration"]
  },
  { 
    name: "Microsoft Excel Online", 
    category: "Spreadsheets", 
    icon: FileText, 
    color: "bg-green-700",
    description: "Advanced spreadsheet capabilities with cloud collaboration",
    features: ["Cloud Spreadsheets", "Advanced Formulas", "Data Visualization", "Collaboration"]
  },
  { 
    name: "Microsoft Word Online", 
    category: "Documents", 
    icon: FileText, 
    color: "bg-blue-700",
    description: "Professional document creation and editing in the cloud",
    features: ["Cloud Documents", "Professional Templates", "Track Changes", "Co-authoring"]
  },
  { 
    name: "Microsoft Outlook Calendar", 
    category: "Calendar", 
    icon: Calendar, 
    color: "bg-blue-600",
    description: "Enterprise calendar solution with meeting management",
    features: ["Calendar Management", "Meeting Scheduling", "Room Booking", "Integration"]
  },
  { 
    name: "Microsoft Outlook Mail", 
    category: "Email", 
    icon: MessageSquare, 
    color: "bg-blue-600",
    description: "Professional email with advanced organization and security",
    features: ["Email Management", "Advanced Security", "Rules", "Categories"]
  },
  { 
    name: "Microsoft Teams", 
    category: "Communication", 
    icon: Users, 
    color: "bg-purple-700",
    description: "Unified communication platform for chat, meetings, and collaboration",
    features: ["Team Communication", "Video Meetings", "File Collaboration", "App Integration"]
  },
  { 
    name: "Google Meet", 
    category: "Video Conferencing", 
    icon: Video, 
    color: "bg-green-500",
    description: "Secure video meetings integrated with Google Workspace",
    features: ["Video Conferencing", "Screen Sharing", "Recording", "Google Integration"]
  },
  { 
    name: "Twilio", 
    category: "SMS", 
    icon: Phone, 
    color: "bg-red-500",
    description: "Programmable SMS and communication APIs for messaging",
    features: ["SMS", "Text Messaging", "Communication APIs", "Automation"]
  }
]

const categories = ["All", "Project Management", "Team Communication", "Video Conferencing", "Cloud Storage", "Task Management", "AI Research", "Spreadsheets", "Documents", "Email", "Calendar", "SMS"]

export default function IntegrationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Mobile Jarvis</h1>
            </div>
          </div>
          <Link href="/integration/setup">
            <Button>Setup Integration</Button>
          </Link>
        </nav>
      </header>

      {/* Page Header */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">All Integrations</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect Mobile Jarvis with your favorite apps and services. Choose from 18+ integrations 
            to streamline your workflow and boost productivity.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center`}>
                    <integration.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="secondary">{integration.category}</Badge>
                </div>
                <CardTitle className="text-xl">{integration.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-semibold text-sm text-gray-900 mb-2">Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {integration.features.map((feature, featureIndex) => (
                      <Badge key={featureIndex} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Link href="/integration/setup">
                  <Button className="w-full">
                    Setup {integration.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No integrations found</p>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Connect?</h3>
          <p className="text-xl mb-8 text-blue-100">
            Start setting up your integrations and unlock the full potential of Mobile Jarvis
          </p>
          <Link href="/integration/setup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
} 