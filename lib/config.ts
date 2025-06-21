/**
 * Single-page integration form configuration
 */
export const INTEGRATION_CONFIG = {
  // Default form ID to load (can be overridden via URL params)
  DEFAULT_FORM_ID: process.env.NEXT_PUBLIC_DEFAULT_FORM_ID || "404b06d2-ea98-4ed1-b4b5-01c7dfb8e99a",
  
  // Default user ID for testing (can be overridden via URL params)
  DEFAULT_USER_ID: process.env.NEXT_PUBLIC_DEFAULT_USER_ID || "user-123",
  
  // App metadata
  APP_TITLE: "Integration Setup",
  APP_DESCRIPTION: "Configure your integration by following the setup instructions and filling out the required fields.",
  
  // Feature flags
  ALLOW_URL_PARAMS: true, // Allow overriding via URL parameters
  SHOW_DEBUG_INFO: false, // Show debug info in dev mode
} 