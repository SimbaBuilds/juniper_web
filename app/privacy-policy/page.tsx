import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Brain, ArrowLeft, Shield, Eye, Lock, Smartphone } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-600">
              Your privacy and data security are our top priorities
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: January 1, 2025
            </p>
          </div>

          {/* Privacy Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Lock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Data Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">All your data is encrypted in transit and at rest</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Transparent Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Clear information about how we use your data</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Smartphone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Your Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Manage your privacy settings and data preferences</p>
              </CardContent>
            </Card>
          </div>

          {/* Privacy Policy Content */}
          <div className="prose prose-lg max-w-none">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
                  <p className="text-gray-600 mb-4">
                    When you use Juniper, we may collect personal information you provide, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Profile information (name, display name, location, profession, education)</li>
                    <li>Contact information (email address for integration purposes)</li>
                    <li>Account preferences and settings</li>
                    <li>Integration authentication tokens and credentials</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Voice and Audio Data</h3>
                  <p className="text-gray-600 mb-4">
                    Juniper processes voice data to provide AI assistance:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Voice recordings for transcription and AI processing</li>
                    <li>Wake word detection data (Android devices)</li>
                    <li>Voice preference settings and selected voices</li>
                    <li>Transcription confidence scores and metadata</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Usage and Device Information</h3>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Device type, operating system, and app version</li>
                    <li>Usage patterns, feature interactions, and preferences</li>
                    <li>Error logs and performance data</li>
                    <li>Integration usage and synchronization data</li>
                  </ul>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                  <p className="text-gray-600 mb-4">We use your information to:</p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li><strong>Provide AI Services:</strong> Process voice commands, generate responses, and manage conversations</li>
                    <li><strong>Manage Integrations:</strong> Connect and synchronize with your chosen third-party services</li>
                    <li><strong>Personalize Experience:</strong> Learn your preferences and habits to improve assistance</li>
                    <li><strong>Improve Services:</strong> Analyze usage patterns to enhance our AI capabilities</li>
                    <li><strong>Ensure Security:</strong> Protect your account and detect unauthorized access</li>
                    <li><strong>Provide Support:</strong> Respond to your questions and technical issues</li>
                  </ul>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Integrations</h2>
                  <p className="text-gray-600 mb-4">
                    Juniper integrates with various third-party services. When you connect these services:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>We store authentication tokens to access your connected accounts</li>
                    <li>We may sync data between Juniper and your connected services</li>
                    <li>Each integration follows the privacy policy of the respective service</li>
                    <li>You can disconnect integrations at any time through your settings</li>
                  </ul>
                  <p className="text-gray-600 mb-4">
                    <strong>Supported Integrations:</strong> Notion, Slack, Todoist, 
                    Perplexity, Google Workspace, Microsoft Office 365, Textbelt, and others.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. AI and Machine Learning</h2>
                  <p className="text-gray-600 mb-4">
                    Juniper uses AI to provide intelligent assistance:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li><strong>Memory Management:</strong> We store conversation context and user preferences to improve future interactions</li>
                    <li><strong>Habit Learning:</strong> We analyze usage patterns to suggest automations and improvements</li>
                    <li><strong>Voice Processing:</strong> Audio data is processed by Deepgram and other speech services</li>
                    <li><strong>AI Models:</strong> We use various language models to generate responses and perform tasks</li>
                    <li><strong>No Unauthorized Training:</strong> We will not use your data to train or improve Juniper's AI models unless you explicitly authorize us to do so</li>
                  </ul>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                  <p className="text-gray-600 mb-4">
                    We implement industry-standard security measures:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Secure authentication and access controls</li>
                    <li>Regular security audits and updates</li>
                    <li>Limited access to personal data by authorized personnel only</li>
                  </ul>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights</h2>
                  <p className="text-gray-600 mb-4">You have the right to:</p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correct:</strong> Update or correct your personal information</li>
                    <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
                    <li><strong>Export:</strong> Download your data in a portable format</li>
                    <li><strong>Opt-out:</strong> Disable specific features like voice processing or habit learning</li>
                  </ul>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
                  <p className="text-gray-600 mb-4">
                    We retain your data only as long as necessary to provide our services:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Account data: Until you delete your account</li>
                    <li>Voice recordings: Processed immediately and not permanently stored unless you opt-in</li>
                    <li>Conversation history: Retained based on your memory management settings</li>
                    <li>Integration data: Until you disconnect the integration</li>
                  </ul>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
                  <p className="text-gray-600 mb-4">
                    Juniper is not intended for children under 13 years of age. We do not knowingly 
                    collect personal information from children under 13.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Policy</h2>
                  <p className="text-gray-600 mb-4">
                    We may update this privacy policy from time to time. We will notify you of any material 
                    changes by posting the new privacy policy on this page and updating the &quot;Last updated&quot; date.
                  </p>
                </section>

                <Separator className="my-8" />

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
                  <p className="text-gray-600 mb-4">
                    If you have any questions about this privacy policy or our privacy practices, please contact us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">
                      <strong>Email:</strong> privacy@mobilejarvis.com<br />
                      <strong>Subject:</strong> Privacy Policy Inquiry
                    </p>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>

          {/* Back to Home CTA */}
          <div className="text-center mt-12">
            <Link href="/">
              <Button size="lg" className="text-lg px-8 py-3">
                Return to Juniper
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Juniper. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 