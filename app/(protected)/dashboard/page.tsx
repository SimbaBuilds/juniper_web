import { getUser } from '@/lib/auth/get-user'

export default async function DashboardPage() {
  const user = await getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">Welcome back, {user.email}!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Automations</h2>
          <p className="text-gray-600">Manage your automated workflows</p>
          <a href="/automations" className="text-blue-600 hover:underline mt-4 inline-block">
            View Automations →
          </a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Integrations</h2>
          <p className="text-gray-600">Connect external services</p>
          <a href="/integrations" className="text-blue-600 hover:underline mt-4 inline-block">
            View Integrations →
          </a>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Repository</h2>
          <p className="text-gray-600">Browse your data repository</p>
          <a href="/repository" className="text-blue-600 hover:underline mt-4 inline-block">
            View Repository →
          </a>
        </div>
      </div>
    </div>
  )
}