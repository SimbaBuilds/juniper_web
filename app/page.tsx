import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockFormConfigs } from '@/lib/mock-data'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Integration Configuration Forms
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Dynamic integration setup forms for various services. 
            Click on any form below to test the integration configuration flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockFormConfigs.map((config) => (
            <Card key={config.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{config.service_name}</CardTitle>
                  <Badge variant="outline">{config.approach}</Badge>
                </div>
                <CardDescription>
                  {config.service_type} • {config.existing_service ? 'Existing service' : 'New setup'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Fields: {config.form_fields.map(f => f.label).join(', ')}
                  </p>
                  
                  <div className="space-y-2">
                    <Link href={`/integration/setup/${config.id}?userId=user-123`}>
                      <Button className="w-full">
                        Configure {config.service_name}
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-500 text-center">
                      Test with user ID: user-123
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions</h3>
              <div className="text-blue-800 text-sm space-y-2">
                <p>• Each form is dynamically generated based on JSON configuration</p>
                <p>• Forms include validation, help text, and password visibility toggles</p>
                <p>• Submission is mocked - check browser console for "database" operations</p>
                <p>• Forms handle different field types: text, password, email, URL, number</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
