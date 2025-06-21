import { createClient } from '@/lib/utils/supabase/client'
import { mockFormConfigs, FormField } from './mock-data'

// Fallback form configuration
const fallbackFormConfig = {
  id: "404b06d2-ea98-4ed1-b4b5-01c7dfb8e99a",
  service_id: "fallback-service",
  setup_instructions: "This is a fallback form that appears when the requested form is not found in the database. It demonstrates the fallback mechanism working correctly.\n\nTo test:\n1. Visit any invalid form ID\n2. This fallback form will load automatically\n3. Fill out the demo fields below",
  json: {
    service_name: "Demo Fallback Service",
    service_type: "demo",
    approach: "fallback",
    existing_service: false,
    form_fields: [
      {
        field_name: "demo_field_1",
        field_type: "text",
        label: "Demo Text Field",
        required: true,
        help_text: "This is a demo text field to show the fallback working"
      },
      {
        field_name: "demo_password",
        field_type: "password", 
        label: "Demo Password Field",
        required: true,
        help_text: "This password field demonstrates the visibility toggle"
      },
      {
        field_name: "demo_email",
        field_type: "email",
        label: "Demo Email Field", 
        required: false,
        help_text: "Optional email field with validation"
      }
    ],
    mapping_instructions: {
      "demo_field_1": "configuration.demo_field_1",
      "demo_password": "configuration.demo_password", 
      "demo_email": "email_address"
    },
    mapping_confidence: 1.0,
    cached: true
  },
  updated_at: new Date()
}

/**
 * Utility to seed the database with sample config forms
 * Run this to populate the config_forms table for testing
 */
export async function seedConfigForms() {
  const supabase = createClient()

  try {
    // First, clear existing mock data (optional)
    const { error: deleteError } = await supabase
      .from('config_forms')
      .delete()
      .in('id', [...mockFormConfigs.map(c => c.id), fallbackFormConfig.id])

    if (deleteError) {
      console.warn('Could not clear existing data:', deleteError.message)
    }

    // Insert mock config forms + fallback form
    const allConfigs = [...mockFormConfigs, fallbackFormConfig]
    const { data, error } = await supabase
      .from('config_forms')
      .insert(
        allConfigs.map(config => ({
          id: config.id,
          service_id: config.service_id,
          json: config.json,
          setup_instructions: config.setup_instructions,
          updated_at: config.updated_at.toISOString()
        }))
      )
      .select()

    if (error) {
      throw error
    }

    console.log('✅ Successfully seeded config forms (including fallback):', data)
    return { success: true, data }

  } catch (error) {
    console.error('❌ Failed to seed config forms:', error)
    return { success: false, error }
  }
}

/**
 * Enhanced config forms with mapping instructions for testing
 */
export const enhancedMockConfigs = [...mockFormConfigs, fallbackFormConfig].map(config => ({
  ...config,
  json: {
    ...config.json,
    // Add mapping instructions for better field mapping
    mapping_instructions: config.json.mapping_instructions || generateMappingInstructions(config.json.form_fields),
    mapping_confidence: config.json.mapping_confidence || 0.85,
    cached: config.json.cached || false
  }
}))

function generateMappingInstructions(fields: FormField[]) {
  const mappingInstructions: Record<string, string> = {}
  
  fields.forEach(field => {
    switch (field.field_name) {
      case 'client_id':
        mappingInstructions[field.field_name] = 'client_id'
        break
      case 'client_secret':
        mappingInstructions[field.field_name] = 'client_secret_value'
        break
      case 'api_key':
        mappingInstructions[field.field_name] = 'access_token'
        break
      case 'email_address':
        mappingInstructions[field.field_name] = 'email_address'
        break
      case 'redirect_uri':
      case 'webhook_url':
      case 'smtp_server':
      case 'smtp_port':
      case 'app_password':
      case 'database_id':
      case 'default_channel':
        mappingInstructions[field.field_name] = `configuration.${field.field_name}`
        break
      default:
        mappingInstructions[field.field_name] = `configuration.${field.field_name}`
    }
  })
  
  return mappingInstructions
}

/**
 * Seed enhanced config forms with mapping instructions
 */
export async function seedEnhancedConfigForms() {
  const supabase = createClient()

  try {
    // Clear existing data
    const { error: deleteError } = await supabase
      .from('config_forms')
      .delete()
      .in('id', enhancedMockConfigs.map(c => c.id))

    if (deleteError) {
      console.warn('Could not clear existing data:', deleteError.message)
    }

    // Insert enhanced config forms
    const { data, error } = await supabase
      .from('config_forms')
      .insert(
        enhancedMockConfigs.map(config => ({
          id: config.id,
          service_id: config.service_id,
          json: config.json,
          setup_instructions: config.setup_instructions,
          updated_at: config.updated_at.toISOString()
        }))
      )
      .select()

    if (error) {
      throw error
    }

    console.log('✅ Successfully seeded enhanced config forms:', data)
    return { success: true, data }

  } catch (error) {
    console.error('❌ Failed to seed enhanced config forms:', error)
    return { success: false, error }
  }
} 