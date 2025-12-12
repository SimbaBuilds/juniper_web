import { getUser } from '@/lib/auth/get-user'
import { ThemeToggle } from '@/app/components/theme-toggle'
import { MobileMenu } from '@/app/components/mobile-menu'
import Link from 'next/link'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <MobileMenu userEmail={user.email || ''} />
              <Link href="/" className="text-xl font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">Juniper</Link>
              <div className="hidden md:flex space-x-6">
                <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
                <a href="/integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</a>
                <a href="/automations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Automations</a>
                <a href="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Chat</a>
                <a href="/wellness" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Wellness</a>
                <a href="/repository" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Repository</a>
                <a href="/account" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Account</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}