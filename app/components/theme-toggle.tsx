'use client'

import dynamic from 'next/dynamic'

const DynamicThemeToggle = dynamic(
  () => import('./theme-toggle-client').then((mod) => ({ default: mod.ThemeToggleClient })),
  {
    ssr: false
  }
)

export function ThemeToggle() {
  return <DynamicThemeToggle />
}