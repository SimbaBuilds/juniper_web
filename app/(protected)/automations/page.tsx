import { getUser } from '@/lib/auth/get-user'

export default async function AutomationsPage() {
  const user = await getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Automations</h1>
      <p className="text-gray-600 mb-8">Manage your automated workflows and triggers</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h2>
          <p className="text-gray-600 mb-4">Get started by creating your first automation</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Create Automation
          </button>
        </div>
      </div>
    </div>
  )
}