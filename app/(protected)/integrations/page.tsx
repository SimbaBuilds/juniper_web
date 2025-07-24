import { getUser } from '@/lib/auth/get-user'

export default async function IntegrationsPage() {
  const user = await getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Integrations</h1>
      <p className="text-gray-600 mb-8">Connect and manage external service integrations</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-2">Available Integrations</h3>
          <p className="text-gray-600 mb-4">Connect popular services to enhance your workflow</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Browse Integrations
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-2">Active Connections</h3>
          <p className="text-gray-600 mb-4">0 active integrations</p>
          <p className="text-sm text-gray-500">No integrations connected yet</p>
        </div>
      </div>
    </div>
  )
}