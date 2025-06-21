import { IntegrationForm } from '@/components/integration-form'

interface Props {
  params: Promise<{ formId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function IntegrationSetupPage({ params, searchParams }: Props) {
  const { formId } = await params
  const search = await searchParams
  const userId = search.userId as string

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
          formId={formId}
          userId={userId}
        />
      </div>
    </div>
  )
} 