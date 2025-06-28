import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Brain, ArrowLeft, FileText, Users, Shield, AlertCircle } from 'lucide-react'

export default function TermsOfUsePage() {
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
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Use</h1>
            <p className="text-xl text-gray-600">
              Please read these terms carefully before using Juniper
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: January 1, 2025
            </p>
          </div>

          {/* Terms Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">User Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your obligations when using Juniper services</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Service Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Information about service uptime and limitations</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Important Notices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Key terms and limitations you should know</p>
              </CardContent>
            </Card>
          </div>

          {/* Terms of Use Content */}
          <div className="prose prose-lg max-w-none">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                  <p className="text-gray-600 mb-4">
                    By accessing and using Juniper (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                  <p className="text-gray-600 mb-4">
                    These Terms of Use apply to all users of the Service, including users who are also contributors of content, information, and other materials or services on the Service.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                  <p className="text-gray-600 mb-4">
                    Juniper is an AI-powered mobile assistant that provides:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Voice-to-voice conversational AI assistance</li>
                    <li>Integration with 18+ third-party services and applications</li>
                    <li>Smart memory management and habit learning</li>
                    <li>Cross-platform mobile applications (iOS and Android)</li>
                    <li>Always-on wake word detection (Android devices)</li>
                    <li>Automation and task management capabilities</li>
                  </ul>
                  <p className="text-gray-600 mb-4">
                    The Service is provided &quot;as is&quot; and Juniper reserves the right to modify, suspend, or discontinue the Service with or without notice.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
                  <p className="text-gray-600 mb-4">
                    To access certain features of the Service, you may be required to create an account. You agree to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Provide accurate, current, and complete information during registration</li>
                    <li>Maintain the security of your password and account</li>
                    <li>Promptly update account information to keep it accurate and complete</li>
                    <li>Accept responsibility for all activities under your account</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                  </ul>
                  <p className="text-gray-600 mb-4">
                    You must be at least 13 years old to create an account and use the Service.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. AI and Voice Processing Terms</h2>
                  <p className="text-gray-600 mb-4">
                    By using Juniper, you understand and agree that:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li><strong>AI Responses:</strong> AI-generated responses are not guaranteed to be accurate, complete, or suitable for any particular purpose</li>
                    <li><strong>Voice Data:</strong> Your voice recordings may be processed by third-party services (e.g., Deepgram) for transcription</li>
                    <li><strong>Learning:</strong> The AI may learn from your interactions to improve personalized assistance</li>
                    <li><strong>No Medical/Legal Advice:</strong> Juniper does not provide medical, legal, financial, or professional advice</li>
                    <li><strong>Content Monitoring:</strong> We may monitor conversations for safety, security, and service improvement purposes</li>
                  </ul>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Integrations</h2>
                  <p className="text-gray-600 mb-4">
                    Juniper integrates with various third-party services. You acknowledge that:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Each integration is subject to the terms and policies of the respective service</li>
                    <li>We are not responsible for the availability, functionality, or content of third-party services</li>
                    <li>You grant Juniper permission to access and sync data from connected services</li>
                    <li>Integration functionality may change or cease without notice due to third-party changes</li>
                    <li>You can disconnect integrations at any time through your account settings</li>
                  </ul>
                  <p className="text-gray-600 mb-4">
                    <strong>Supported Services:</strong> Notion, Slack, Trello, Zoom, Dropbox, Todoist, Perplexity, Google Workspace, Microsoft Office 365, Twilio, and others as specified in the application.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Conduct and Prohibited Uses</h2>
                  <p className="text-gray-600 mb-4">You agree not to use the Service to:</p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Violate any applicable laws, regulations, or third-party rights</li>
                    <li>Transmit harmful, threatening, abusive, or inappropriate content</li>
                    <li>Attempt to gain unauthorized access to the Service or other users&apos; accounts</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Use the Service for commercial purposes without authorization</li>
                    <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                    <li>Create false accounts or impersonate others</li>
                    <li>Spam, harass, or send unsolicited communications</li>
                  </ul>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
                  <p className="text-gray-600 mb-4">
                    The Service and its original content, features, and functionality are and will remain the exclusive property of Juniper and its licensors. The Service is protected by copyright, trademark, and other laws.
                  </p>
                  <p className="text-gray-600 mb-4">
                    You retain ownership of content you provide to the Service, but grant Juniper a license to use, modify, and process your content as necessary to provide the Service.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
                  <p className="text-gray-600 mb-4">
                    Your privacy is important to us. Please review our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>, which also governs your use of the Service, to understand our practices.
                  </p>
                  <p className="text-gray-600 mb-4">
                    By using the Service, you consent to the collection, use, and sharing of your information as described in our Privacy Policy.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Service Availability and Modifications</h2>
                  <p className="text-gray-600 mb-4">
                    We strive to provide reliable service, but cannot guarantee:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-1">
                    <li>Uninterrupted or error-free service operation</li>
                    <li>Availability of all features at all times</li>
                    <li>Compatibility with all devices or operating systems</li>
                    <li>Maintenance of specific response times or performance levels</li>
                  </ul>
                  <p className="text-gray-600 mb-4">
                    We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimers and Limitations of Liability</h2>
                  <p className="text-gray-600 mb-4">
                    THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST EXTENT PERMITTED BY LAW, Juniper DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED.
                  </p>
                  <p className="text-gray-600 mb-4">
                    IN NO EVENT SHALL Juniper BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
                  <p className="text-gray-600 mb-4">
                    You may terminate your account at any time by contacting us or using account deletion features in the application.
                  </p>
                  <p className="text-gray-600 mb-4">
                    We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including violation of these Terms.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Upon termination, your right to use the Service will cease immediately, and we may delete your account and all associated data.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
                  <p className="text-gray-600 mb-4">
                    These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where Juniper is headquartered, without regard to conflict of law principles.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, except where prohibited by law.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
                  <p className="text-gray-600 mb-4">
                    We reserve the right to update these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
                  </p>
                </section>

                <Separator className="my-8" />

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Severability</h2>
                  <p className="text-gray-600 mb-4">
                    If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law.
                  </p>
                </section>

                <Separator className="my-8" />

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
                  <p className="text-gray-600 mb-4">
                    If you have any questions about these Terms of Use, please contact us:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600">
                      <strong>Email:</strong> legal@mobilejarvis.com<br />
                      <strong>Subject:</strong> Terms of Use Inquiry
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