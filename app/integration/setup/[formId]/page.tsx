import { IntegrationForm } from '@/components/integration-form'
import { NotFound } from '@/components/not-found'
import { mockFormConfigs } from '@/lib/mock-data'

interface Props {
  params: Promise<{ formId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function IntegrationSetupPage({ params, searchParams }: Props) {
  const { formId } = await params
  const search = await searchParams
  const userId = search.userId as string

  // Mock fetching form configuration
  const formConfig = mockFormConfigs.find(config => config.id === formId)

  if (!formConfig) {
    return <NotFound />
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Missing User ID</h1>
          <p className="text-gray-600">
            This form requires a valid user ID. Please check your link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <IntegrationForm 
          formConfig={formConfig}
          userId={userId}
        />
      </div>
    </div>
  )
} 