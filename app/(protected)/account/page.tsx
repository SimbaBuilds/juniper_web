import { getUser } from '@/lib/auth/get-user'
import { fetchUserProfile } from '@/lib/services'

export default async function AccountPage() {
  const user = await getUser()
  const userProfile = await fetchUserProfile(user.id)
  
  // Mock subscription data - this would come from a billing system
  const mockSubscription = {
    plan: 'pro',
    status: 'active',
    current_period_start: new Date('2024-01-01'),
    current_period_end: new Date('2024-02-01'),
    cancel_at_period_end: false,
    requests_limit: 5000,
    requests_used: userProfile?.requests_month || 0
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          View your account information and preferences. Most settings are managed through the mobile app.
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">Profile Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* <div>
            <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
            <input
              type="text"
              value={userProfile?.display_name || 'Not provided'}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div> */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <input
              type="email"
              value={user.email || 'Not provided'}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
            <input
              type="text"
              value={userProfile?.phone || 'Not provided'}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div> */}
          {/* <div>
            <label className="block text-sm font-medium text-foreground mb-2">Location</label>
            <input
              type="text"
              value={userProfile?.location || 'Not provided'}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div> */}
          {/* <div>
            <label className="block text-sm font-medium text-foreground mb-2">Education</label>
            <input
              type="text"
              value={userProfile?.education || 'Not provided'}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div> */}
          {/* <div>
            <label className="block text-sm font-medium text-foreground mb-2">Profession</label>
            <input
              type="text"
              value={userProfile?.profession || 'Not provided'}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div> */}
        {/* </div>
        <div className="mt-4 p-3 bg-muted rounded-md"> */}
          {/* <p className="text-xs text-muted-foreground text-center">
            Profile information can be updated through the mobile app
          </p> */}
        </div>
      </div>

      {/* Subscription & Billing */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">Subscription & Billing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Current Plan</label>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                  {mockSubscription.plan.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  mockSubscription.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {mockSubscription.status}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Billing Period</label>
              <p className="text-sm text-muted-foreground">
                {mockSubscription.current_period_start.toLocaleDateString()} - {mockSubscription.current_period_end.toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Usage This Month</label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requests used:</span>
                  <span className="font-medium text-foreground">
                    {mockSubscription.requests_used.toLocaleString()} / {mockSubscription.requests_limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(mockSubscription.requests_used / mockSubscription.requests_limit) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
            Manage Subscription
          </button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 ml-2">
            View Billing History
          </button>
          
          {mockSubscription.cancel_at_period_end && (
            <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md dark:bg-yellow-900 dark:text-yellow-200">
              <p className="text-sm">
                Your subscription will be canceled at the end of the current billing period ({mockSubscription.current_period_end.toLocaleDateString()}).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Voice & AI Settings */}
      {/* <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">Voice & AI Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Language Model</label>
            <input
              type="text"
              value={AVAILABLE_MODELS.find(m => m.value === userProfile?.base_language_model)?.label || userProfile?.base_language_model || 'Not configured'}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
            <input
              type="text"
              value={userProfile?.timezone || 'Not configured'}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Deepgram Voice</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={userProfile?.selected_deepgram_voice || 'Not selected'}
                disabled
                className="flex-1 px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
              />
              <span className={`px-2 py-1 rounded-full text-xs ${
                userProfile?.deepgram_enabled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {userProfile?.deepgram_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Wake Word</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={userProfile?.wake_word || 'Not set'}
                  disabled
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
                />
                <span className={`px-2 py-1 rounded-full text-xs ${
                  userProfile?.wake_word_detection_enabled 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                }`}>
                  {userProfile?.wake_word_detection_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Sensitivity: {userProfile?.wake_word_sensitivity || 50}%
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">General Instructions</label>
            <textarea
              value={userProfile?.general_instructions || 'No custom instructions set'}
              disabled
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground resize-none"
            />
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground text-center">
            Voice and AI settings can be modified through the mobile app
          </p>
        </div>
      </div> */}

      {/* Usage Statistics */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">Usage Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{userProfile?.requests_today || 0}</div>
            <p className="text-sm text-muted-foreground">Requests Today</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{userProfile?.requests_week || 0}</div>
            <p className="text-sm text-muted-foreground">Requests This Week</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">{userProfile?.requests_month || 0}</div>
            <p className="text-sm text-muted-foreground">Requests This Month</p>
          </div>
        </div>
      </div>

      {/* XAI & Search Settings */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">Search & Research Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">XAI LiveSearch</label>
              <p className="text-xs text-muted-foreground">Real-time web search capabilities</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              userProfile.xai_live_search_enabled 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {userProfile.xai_live_search_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-foreground">Safe Search</label>
              <p className="text-xs text-muted-foreground">Filter explicit content from search results</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              userProfile.xai_live_search_safe_search 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {userProfile.xai_live_search_safe_search ? 'On' : 'Off'}
            </span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground text-center">
            Search preferences can be modified through the mobile app
          </p>
        </div>
      </div>

      {/* User Tags */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">User Tags</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {userProfile?.user_tags?.length ? userProfile.user_tags.map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          )) : (
            <span className="text-sm text-muted-foreground">No user tags configured</span>
          )}
        </div>
        
        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground text-center">
            User tags help personalize your AI assistant experience
          </p>
        </div>
      </div>

      {/* Account Management */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">Account Management</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Account created: {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'}
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: {userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4">
              Account deletion is permanent and cannot be undone. All your data, including integrations, automations, and repository items, will be permanently deleted.
            </p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Delete Account
            </button>
            <p className="text-xs text-red-500 mt-2">
              Account deletion must be performed through the mobile app for security reasons
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}