"use client"

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, HelpCircle, CheckCircle, Loader2, Info, Copy, Check } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfigFormData } from '@/lib/mock-data'
import { createClient } from '@/lib/utils/supabase/client'

interface IntegrationFormProps {
  formId: string
  userId: string
}

export function IntegrationForm({ formId, userId }: IntegrationFormProps) {
  const [configForm, setConfigForm] = useState<ConfigFormData | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Copy to clipboard function
  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFields(prev => ({ ...prev, [fieldName]: true }))
      setTimeout(() => {
        setCopiedFields(prev => ({ ...prev, [fieldName]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Function to determine next status based on auth requirements
  const determineNextStatus = async (serviceId: string, userId: string): Promise<string> => {
    try {
      // Get the integration build state to check auth requirements
      const { data: buildState } = await supabase
        .from('integration_build_states')
        .select('state_data')
        .eq('user_id', userId)
        .eq('service_name', configForm?.service_name || 'Unknown Service')
        .single()

      // Check if auth is needed (default to true if not specified)
      const authNeeded = buildState?.state_data?.auth_needed ?? true

      // Return appropriate status based on auth requirements
      return authNeeded ? 'auth_ready' : 'form_completed'
    } catch (error) {
      console.warn('Could not determine auth requirements, defaulting to auth_ready:', error)
      return 'auth_ready'
    }
  }

  const fetchConfigForm = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch config form from database
      const { data: configFormData, error: configError } = await supabase
        .from('config_forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (configError || !configFormData?.json) {
        // Fallback to specific form ID when original form is not found
        console.warn(`Form ${formId} not found, trying fallback form...`)
        
        const { data: fallbackFormData, error: fallbackError } = await supabase
          .from('config_forms')
          .select('*')
          .eq('id', '404b06d2-ea98-4ed1-b4b5-01c7dfb8e99a')
          .single()

        if (fallbackError || !fallbackFormData?.json) {
          throw new Error(`Neither form ${formId} nor fallback form found`)
        }

        const fallbackConfig: ConfigFormData = {
          ...fallbackFormData.json,
          setup_instructions: fallbackFormData.setup_instructions || ''
        }
        
        setConfigForm(fallbackConfig)
        return
      }

      const formConfig: ConfigFormData = {
        ...configFormData.json,
        setup_instructions: configFormData.setup_instructions || ''
      }
      
      setConfigForm(formConfig)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config form')
      console.error('Error fetching config form:', err)
    } finally {
      setLoading(false)
    }
  }, [formId, supabase])

  useEffect(() => {
    fetchConfigForm()
  }, [fetchConfigForm])

  // Dynamic schema generation based on form fields
  const createSchema = () => {
    if (!configForm) return z.object({})
    
    const schemaObj: Record<string, z.ZodTypeAny> = {}
    
    configForm.form_fields.forEach((field) => {
      // Readonly fields don't need validation since they can't be changed
      if (field.readonly) {
        schemaObj[field.field_name] = z.string().optional()
        return
      }
      
      if (field.field_type === 'number') {
        schemaObj[field.field_name] = field.required 
          ? z.coerce.number().min(1, `${field.label} is required`)
          : z.coerce.number().optional()
      } else {
        let fieldSchema = z.string()
        
        if (field.field_type === 'email') {
          fieldSchema = fieldSchema.email('Invalid email format')
        } else if (field.field_type === 'url') {
          fieldSchema = fieldSchema.url('Invalid URL format')
        }
        
        schemaObj[field.field_name] = field.required
          ? fieldSchema.min(1, `${field.label} is required`)
          : fieldSchema.optional()
      }
    })
    
    return z.object(schemaObj)
  }

  const schema = createSchema()
  type FormData = z.infer<typeof schema>

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: configForm?.form_fields.reduce((acc, field) => ({
      ...acc,
      [field.field_name]: field.default_value || ''
    }), {}) || {}
  })

  // Update form defaults when configForm changes
  useEffect(() => {
    if (configForm) {
      const defaults = configForm.form_fields.reduce((acc, field) => ({
        ...acc,
        [field.field_name]: field.default_value || ''
      }), {})
      form.reset(defaults)
    }
  }, [configForm, form])

  // Hybrid mapping system from dynamic example
  const mapFormDataToIntegrationSchema = async (
    formData: Record<string, unknown>, 
    configForm: ConfigFormData
  ): Promise<Record<string, unknown>> => {
    const nextStatus = await determineNextStatus(formId, userId)
    
    const mappedData: Record<string, unknown> = {
      user_id: userId,
      service_id: formId, // Using formId as service_id for now
      configuration: {},
      status: nextStatus
    }

    // Use hybrid mapping instructions if available
    const mappingInstructions = configForm.mapping_instructions || {}

    Object.entries(formData).forEach(([fieldName, value]) => {
      const mapping = mappingInstructions[fieldName]
      
      if (mapping) {
        if (mapping.startsWith('configuration.')) {
          // Map to configuration JSON
          const configKey = mapping.replace('configuration.', '')
          ;(mappedData.configuration as Record<string, unknown>)[configKey] = value
        } else {
          // Map to direct database column
          mappedData[mapping] = value
        }
      } else {
        // Enhanced fallback mapping based on field names
        switch (fieldName) {
          case 'client_id':
            mappedData.client_id = value
            break
          case 'client_secret':
            mappedData.client_secret_value = value
            break
          case 'api_key':
            mappedData.access_token = value
            break
          case 'email_address':
            mappedData.email_address = value
            break
          default:
            // Fallback: put in configuration
            ;(mappedData.configuration as Record<string, unknown>)[fieldName] = value
        }
      }
    })

    return mappedData
  }

  const submitToIntegration = async (mappedData: Record<string, unknown>) => {
    // First, try to find existing integration
    const { data: existingIntegration } = await supabase
      .from('integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('service_id', mappedData.service_id)
      .single()

    if (existingIntegration) {
      // Update existing integration
      const { error } = await supabase
        .from('integrations')
        .update({
          ...mappedData,
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existingIntegration.id)

      if (error) {
        throw new Error(`Failed to update integration: ${error.message}`)
      }
    } else {
      // Create new integration
      const { error } = await supabase
        .from('integrations')
        .insert([{
          ...mappedData,
          created_at: new Date().toISOString(),
          is_active: true
        }])

      if (error) {
        throw new Error(`Failed to create integration: ${error.message}`)
      }
    }

    // Determine the next status for build state
    const nextStatus = await determineNextStatus(formId, userId)

    // Update integration build state
    const { error: buildStateError } = await supabase
      .from('integration_build_states')
      .upsert({
        user_id: userId,
        service_name: configForm?.service_name || 'Unknown Service',
        current_status: nextStatus,
        completed_steps: ['form_response'],
        state_data: { form_data_received: true },
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id,service_name'
      })

    if (buildStateError) {
      console.error('Failed to update build state:', buildStateError)
      // Don't throw error here as integration was successful
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!configForm) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Map form data to integration schema using hybrid mapping
      const mappedData = await mapFormDataToIntegrationSchema(data, configForm)

      // Submit to database
      await submitToIntegration(mappedData)

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form')
      console.error('Form submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check auth requirements for user expectation setting
  const [authNeeded, setAuthNeeded] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuthRequirements = async () => {
      if (!configForm || !userId) return

      try {
        const { data: buildState } = await supabase
          .from('integration_build_states')
          .select('state_data')
          .eq('user_id', userId)
          .eq('service_name', configForm.service_name)
          .single()

        const authRequired = buildState?.state_data?.auth_needed ?? true
        setAuthNeeded(authRequired)
      } catch (error) {
        console.warn('Could not check auth requirements:', error)
        setAuthNeeded(true) // Default to true
      }
    }

    checkAuthRequirements()
  }, [configForm, userId, supabase])

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading setup instructions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!configForm) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center p-8">
            <p className="text-gray-500">No configuration form available for this service.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isSubmitted) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-700">Integration Configured!</h2>
            <p className="text-gray-600">
              Your {configForm.service_name} integration has been successfully configured.
              You can now return to the mobile app to continue.
            </p>
            <Button 
              onClick={() => window.close()} 
              className="mt-4"
            >
              Close Window
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Configure {configForm.service_name} Integration
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
          <div className="text-blue-800 text-sm whitespace-pre-line">
            {configForm.setup_instructions}
          </div>
        </div>

        {/* User Expectation Setting - Optional UI */}
        {authNeeded !== null && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                {authNeeded ? 
                  "After submitting, you'll complete authentication in your mobile app" :
                  "After submitting, your integration will be ready to activate!"
                }
              </div>
            </div>
          </div>
        )}

        {/* Mapping confidence indicator */}
        {configForm.mapping_confidence && (
          <div className="flex items-center text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              configForm.mapping_confidence > 0.8 ? 'bg-green-500' : 
              configForm.mapping_confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            Mapping confidence: {Math.round(configForm.mapping_confidence * 100)}%
          </div>
        )}

        <Separator />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TooltipProvider>
            {configForm.form_fields.map((field) => (
              <div key={field.field_name} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={field.field_name} className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.help_text && (
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{field.help_text}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

{field.readonly ? (
                  <div className="relative">
                    <Input
                      id={field.field_name}
                      type="text"
                      value={field.default_value || ''}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed pr-10"
                      {...form.register(field.field_name)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => copyToClipboard(field.default_value || '', field.field_name)}
                    >
                      {copiedFields[field.field_name] ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : field.field_type === 'textarea' ? (
                  <Textarea
                    id={field.field_name}
                    placeholder={field.help_text}
                    {...form.register(field.field_name)}
                    className="min-h-[100px]"
                  />
                ) : field.field_type === 'password' ? (
                  <div className="relative">
                    <Input
                      id={field.field_name}
                      type={showPasswords[field.field_name] ? 'text' : 'password'}
                      placeholder={field.help_text}
                      {...form.register(field.field_name)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({
                        ...prev,
                        [field.field_name]: !prev[field.field_name]
                      }))}
                    >
                      {showPasswords[field.field_name] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Input
                    id={field.field_name}
                    type={field.field_type}
                    placeholder={field.help_text}
                    {...form.register(field.field_name)}
                  />
                )}

                {form.formState.errors[field.field_name] && (
                  <p className="text-sm text-red-600">
                    {(form.formState.errors[field.field_name] as { message?: string })?.message || 'This field is required'}
                  </p>
                )}
              </div>
            ))}
          </TooltipProvider>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configuring Integration...
              </>
            ) : (
              'Complete Integration Setup'
            )}
          </Button>

          {/* Approach indicator */}
          <div className="text-center text-sm text-gray-500">
            Integration method: {configForm.approach}
            {configForm.cached && <span className="ml-2 text-blue-600">(Cached)</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 