/**
 * Mobile Jarvis integration configuration
 */
export const INTEGRATION_CONFIG = {
  // Default form ID to load (can be overridden via URL params)
  DEFAULT_FORM_ID: process.env.NEXT_PUBLIC_DEFAULT_FORM_ID || "404b06d2-ea98-4ed1-b4b5-01c7dfb8e99a",
  
  // Default user ID for testing (can be overridden via URL params)
  DEFAULT_USER_ID: process.env.NEXT_PUBLIC_DEFAULT_USER_ID || "user-123",
  
  // App metadata
  APP_TITLE: "Mobile Jarvis - Integration Setup",
  APP_DESCRIPTION: "Configure your Mobile Jarvis integrations to connect with your favorite apps and services.",
  
  // Feature flags
  ALLOW_URL_PARAMS: true, // Allow overriding via URL parameters
  SHOW_DEBUG_INFO: false, // Show debug info in dev mode
  
  // App routing
  ROUTES: {
    HOME: "/",
    INTEGRATIONS: "/integrations",
    INTEGRATION_SETUP: "/integration/setup",
    INTEGRATION_SETUP_FORM: "/integration/setup/[formId]",
  }
} as const

/**
 * Mobile Jarvis application constants
 */
export const APP_CONFIG = {
  NAME: "Mobile Jarvis",
  TAGLINE: "AI-Powered Mobile Assistant",
  DESCRIPTION: "Connect all your favorite apps and services with voice-controlled intelligence. Mobile Jarvis integrates seamlessly with 18+ platforms to streamline your workflow.",
  
  // Feature highlights
  FEATURES: {
    VOICE_CONTROL: "Hands-free Voice to Voice Chat",
    CROSS_PLATFORM: "iOS and Android Support",
    WAKE_WORD: "Always-on Wake Word Detection (Android)",
    MEMORY_MANAGEMENT: "Smart or Manual Memory Management",
    INTEGRATIONS: "18+ Service Integrations"
  },
  
  // Integration count
  INTEGRATION_COUNT: 18,
  
  // Platform support
  PLATFORMS: ["iOS", "Android"]
} as const 