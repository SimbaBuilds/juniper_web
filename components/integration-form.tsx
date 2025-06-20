"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, HelpCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FormConfig } from '@/lib/mock-data'

interface IntegrationFormProps {
  formConfig: FormConfig
  userId: string
}

export function IntegrationForm({ formConfig, userId }: IntegrationFormProps) {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dynamic schema generation based on form fields
  const createSchema = () => {
    const schemaObj: Record<string, z.ZodString | z.ZodNumber> = {}
    
    formConfig.form_fields.forEach(field => {
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
        
        if (field.required) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`)
        } else {
          fieldSchema = fieldSchema.optional()
        }
        
        schemaObj[field.field_name] = fieldSchema
      }
    })
    
    return z.object(schemaObj)
  }

  const schema = createSchema()
  type FormData = z.infer<typeof schema>

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: formConfig.form_fields.reduce((acc, field) => {
      acc[field.field_name as keyof FormData] = field.default_value || ''
      return acc
    }, {} as FormData)
  })

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Mock API call - simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock database operations
      console.log('Mock Integration Update:', {
        userId,
        serviceId: formConfig.service_name,
        credentials: data,
        status: 'auth_ready'
      })
      
      console.log('Mock IntegrationBuildState Update:', {
        userId,
        serviceName: formConfig.service_name,
        currentStatus: 'auth_ready',
        completedSteps: ['form_response'],
        stateData: { form_data_received: true }
      })

      setIsSubmitted(true)
    } catch (err) {
      setError('Failed to submit form. Please try again.')
      console.error('Form submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-700">Integration Configured!</h2>
            <p className="text-gray-600">
              Your {formConfig.service_name} integration has been successfully configured.
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
          Configure {formConfig.service_name} Integration
        </CardTitle>
        <CardDescription>
          {formConfig.existing_service 
            ? 'Connect your existing account' 
            : 'Set up a new integration'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
          <div className="text-blue-800 text-sm whitespace-pre-line">
            {formConfig.setup_instructions}
          </div>
        </div>

        <Separator />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TooltipProvider>
            {formConfig.form_fields.map((field) => (
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
                
                <div className="relative">
                  {field.field_type === 'textarea' ? (
                    <Textarea
                      id={field.field_name}
                      {...form.register(field.field_name as keyof FormData)}
                      placeholder={field.help_text}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={field.field_name}
                      type={
                        field.field_type === 'password' && !showPasswords[field.field_name]
                          ? 'password'
                          : field.field_type === 'password' && showPasswords[field.field_name]
                          ? 'text'
                          : field.field_type
                      }
                      {...form.register(field.field_name as keyof FormData)}
                      placeholder={field.help_text}
                    />
                  )}
                  
                  {field.field_type === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => togglePasswordVisibility(field.field_name)}
                    >
                      {showPasswords[field.field_name] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                
                {form.formState.errors[field.field_name as keyof FormData] && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors[field.field_name as keyof FormData]?.message}
                  </p>
                )}
              </div>
            ))}
          </TooltipProvider>

          <Separator />

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
        </form>
      </CardContent>
    </Card>
  )
} 