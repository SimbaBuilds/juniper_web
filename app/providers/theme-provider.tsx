'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { themes, type ThemeName, getCSSVariables } from '@/lib/themes'

type Mode = 'dark' | 'light'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: ThemeName
  defaultMode?: Mode
  storageKey?: string
}

type ThemeProviderState = {
  theme: ThemeName
  mode: Mode
  setTheme: (theme: ThemeName) => void
  setMode: (mode: Mode) => void
  toggleMode: () => void
  mounted: boolean
}

const initialState: ThemeProviderState = {
  theme: 'default',
  mode: 'light',
  setTheme: () => null,
  setMode: () => null,
  toggleMode: () => null,
  mounted: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'vintage',
  defaultMode = 'light',
  storageKey = 'juniper-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme)
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedData = localStorage.getItem(storageKey)
    if (storedData) {
      try {
        const { theme: storedTheme, mode: storedMode } = JSON.parse(storedData)
        if (storedTheme && themes[storedTheme]) {
          setTheme(storedTheme)
        }
        if (storedMode && (storedMode === 'light' || storedMode === 'dark')) {
          setMode(storedMode)
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [storageKey])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    Object.keys(themes).forEach(themeName => {
      root.classList.remove(themeName)
    })
    
    // Add current mode and theme classes
    root.classList.add(mode)
    root.classList.add(theme)
    
    // Apply CSS variables
    const cssVariables = getCSSVariables(theme, mode)
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [theme, mode, mounted])

  const updateTheme = (newTheme: ThemeName) => {
    const data = { theme: newTheme, mode }
    localStorage.setItem(storageKey, JSON.stringify(data))
    setTheme(newTheme)
  }

  const updateMode = (newMode: Mode) => {
    const data = { theme, mode: newMode }
    localStorage.setItem(storageKey, JSON.stringify(data))
    setMode(newMode)
  }

  const toggleMode = () => {
    updateMode(mode === 'light' ? 'dark' : 'light')
  }

  const value = {
    theme,
    mode,
    setTheme: updateTheme,
    setMode: updateMode,
    toggleMode,
    mounted,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}