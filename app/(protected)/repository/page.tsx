import { getUser } from '@/lib/auth/get-user'

export default async function RepositoryPage() {
  const user = await getUser()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Repository</h1>
      <p className="text-gray-600 mb-8">Browse and manage your data repository</p>
      
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Repository Contents</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Upload File
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by uploading your first file</p>
          </div>
        </div>
      </div>
    </div>
  )
}