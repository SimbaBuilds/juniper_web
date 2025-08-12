import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Brain, 
  ArrowLeft, 
  HelpCircle, 
  MessageCircle, 
  Mic, 
  Smartphone, 
  Zap, 
  Shield, 
  Settings, 
  RefreshCw,
  Wifi,
  Smartphone as Phone,
  Mail,
  Calendar,
  Activity
} from 'lucide-react'

const faqs = [
  {
    question: "How do I get started with Juniper?",
    answer: "Download the app from the App Store or Google Play Store, create an account, and start by connecting your first integration. You can begin with voice commands or chat to explore features."
  },
  {
    question: "Which platforms is Juniper available on?",
    answer: "Juniper is available on iOS, Android, and web. Your data and preferences sync seamlessly across all platforms, so you can start on mobile and continue on web."
  },
  {
    question: "What integrations does Juniper support?",
    answer: "Juniper supports 16+ premium integrations including Oura, Gmail, Slack, Notion, Apple Health, and many more. We're constantly adding new integrations based on user feedback."
  },
  {
    question: "How does the voice control work?",
    answer: "Simply tap the microphone button and speak naturally. Juniper understands natural language and can handle complex requests like 'Schedule a workout for tomorrow based on my sleep data' or 'Draft an email to my team about this week's progress'."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, Juniper prioritizes your privacy and security. All data is encrypted in transit and at rest, and we follow industry best practices for data protection. We never share your personal information with third parties."
  },
  {
    question: "Can I use Juniper offline?",
    answer: "Juniper requires an internet connection to process voice commands and access integrations. However, some basic features and your stored resources are available offline."
  },
  {
    question: "How does Juniper learn my preferences?",
    answer: "Juniper uses a smart memory system that learns from your interactions, communication style, and preferences over time. The more you use it, the more personalized your experience becomes."
  },
  {
    question: "What if an integration isn't working?",
    answer: "First, check your internet connection and ensure the integration is properly connected. If issues persist, try disconnecting and reconnecting the integration, or contact our support team for assistance."
  }
]

const troubleshootingSteps = [
  {
    icon: Wifi,
    title: "Connection Issues",
    steps: [
      "Check your internet connection",
      "Ensure the app has network permissions",
      "Try switching between WiFi and mobile data",
      "Restart the app if problems persist"
    ]
  },
  {
    icon: Mic,
    title: "Voice Recognition Problems",
    steps: [
      "Speak clearly and at a normal volume",
      "Check microphone permissions in device settings",
      "Ensure you're in a quiet environment",
      "Try using chat mode as an alternative"
    ]
  },
  {
    icon: Zap,
    title: "Integration Troubleshooting",
    steps: [
      "Verify your account credentials",
      "Check if the service is experiencing downtime",
      "Disconnect and reconnect the integration",
      "Ensure you have the latest app version"
    ]
  },
  {
    icon: Smartphone,
    title: "App Performance Issues",
    steps: [
      "Close and restart the app",
      "Clear app cache and data",
      "Update to the latest version",
      "Restart your device if needed"
    ]
  }
]

const commonIssues = [
  {
    icon: Phone,
    title: "Mobile App Issues",
    description: "Problems with iOS or Android app functionality, crashes, or performance issues.",
    solutions: ["Update to latest version", "Clear app cache", "Reinstall if necessary"]
  },
  {
    icon: Mail,
    title: "Email Integration Problems",
    description: "Issues with Gmail, Outlook, or other email service connections.",
    solutions: ["Verify account permissions", "Check 2FA settings", "Re-authenticate connection"]
  },
  {
    icon: Calendar,
    title: "Calendar Sync Issues",
    description: "Problems with calendar integration and appointment management.",
    solutions: ["Check calendar permissions", "Verify timezone settings", "Sync calendar manually"]
  },
  {
    icon: Activity,
    title: "Health Data Integration",
    description: "Issues with Oura, Apple Health, or other health platform connections.",
    solutions: ["Ensure health app permissions", "Check data sharing settings", "Verify account linking"]
  }
]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
                <span className="text-lg font-semibold text-gray-900">Juniper</span>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <HelpCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h1>
            <p className="text-xl text-gray-600">
              Get help with Juniper and find solutions to common issues
            </p>
          </div>

          {/* Quick Help Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Chat Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Get real-time help from our support team</p>
                <Button className="w-full">Start Chat</Button>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Setup Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Step-by-step setup instructions</p>
                <Link href="/integration-descriptions">
                  <Button variant="outline" className="w-full">View Guide</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Status Page</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Check service status and updates</p>
                <Button variant="outline" className="w-full">Check Status</Button>
              </CardContent>
            </Card>
          </div>

          {/* Troubleshooting Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Quick Troubleshooting</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {troubleshootingSteps.map((category, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <category.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                      {category.steps.map((step, stepIndex) => (
                        <li key={stepIndex}>{step}</li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Common Issues Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Common Issues & Solutions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {commonIssues.map((issue, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <issue.icon className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{issue.description}</p>
                    <div className="space-y-2">
                      <p className="font-medium text-gray-800">Solutions:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {issue.solutions.map((solution, solIndex) => (
                          <li key={solIndex}>{solution}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Contact Support Section */}
          <section className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our support team is here to help you get the most out of Juniper. 
                Contact us for personalized assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-3">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Contact Support
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                  <Mail className="h-5 w-5 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          </section>

          {/* Additional Resources */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Additional Resources</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/integration-descriptions">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Zap className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Integration Guide</h3>
                    <p className="text-gray-600">Learn how to connect and use all available integrations</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/privacy-policy">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Privacy Policy</h3>
                    <p className="text-gray-600">Understand how we protect your data and privacy</p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/terms-of-use">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Settings className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Terms of Use</h3>
                    <p className="text-gray-600">Review our terms and conditions of service</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
