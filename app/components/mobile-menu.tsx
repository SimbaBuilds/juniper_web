"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface MobileMenuProps {
  userEmail: string
}

export function MobileMenu({ userEmail }: MobileMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Juniper</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-6 pl-4">
          <SheetClose asChild>
            <Link 
              href="/dashboard" 
              className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Dashboard
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link 
              href="/chat" 
              className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Chat
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link 
              href="/wellness" 
              className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Wellness
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/integrations"
              className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Integrations
            </Link>
          </SheetClose>
          {/* <SheetClose asChild>
            <Link
              href="/automations"
              className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Automations
            </Link>
          </SheetClose> */}
          <SheetClose asChild>
            <Link
              href="/repository"
              className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Repository
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link 
              href="/account" 
              className="text-base text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Account
            </Link>
          </SheetClose>
        </nav>
        <div className="mt-auto pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">{userEmail}</p>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}