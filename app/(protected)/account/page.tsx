import { getUser } from '@/lib/auth/get-user'

export default async function AccountPage() {
  const user = await getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Account Settings</h1>
      <p className="text-gray-600 mb-8">Manage your account preferences and settings</p>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <input
                type="text"
                value={user.id}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Security</h2>
          <div className="space-y-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Change Password
            </button>
            <div>
              <p className="text-sm text-gray-600">
                Last sign in: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4 text-red-600">Danger Zone</h2>
          <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
            Delete Account
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
        </div>
      </div>
    </div>
  )
}