import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Form Not Found</h2>
            <p className="text-gray-600">
              The integration form you're looking for doesn't exist or may have expired.
              Please check your link or contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 