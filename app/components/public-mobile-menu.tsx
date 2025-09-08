"use client"

import { Menu, Brain } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface PublicMobileMenuProps {
  user?: { email?: string } | null
  loading?: boolean
}

export function PublicMobileMenu({ user, loading }: PublicMobileMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6" style={{color: 'var(--muted-blue)'}} />
            <SheetTitle>Juniper</SheetTitle>
          </div>
        </SheetHeader>
        <div className="mt-8 space-y-4 pl-4">
          <div className="space-y-2 pb-4 border-b border-border">
            <SheetClose asChild>
              <Link href="/blog" className="block text-foreground hover:text-primary transition-colors py-2">
                Blog
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/integration-descriptions" className="block text-foreground hover:text-primary transition-colors py-2">
                Integrations
              </Link>
            </SheetClose>
          </div>
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : user ? (
            <>
              <p className="text-sm text-muted-foreground border-b border-border pb-4">{user.email || 'User'}</p>
              <SheetClose asChild>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">Dashboard</Button>
                </Link>
              </SheetClose>
              <form action="/api/auth/signout" method="POST" className="w-full">
                <Button variant="ghost" type="submit" className="w-full">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <SheetClose asChild>
                <Link href="/login">
                  <Button variant="ghost" className="w-full">Sign in</Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/signup">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </SheetClose>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}