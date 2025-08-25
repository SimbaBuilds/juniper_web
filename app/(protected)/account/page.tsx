import { getUser } from '@/lib/auth/get-user'
import { fetchUserProfile } from '@/lib/services'
import SubscriptionManager from '@/app/components/subscription/subscription-manager'
import MaxUbpSetting from '@/app/components/max-ubp-setting'
import AccountDeleteButton from '@/app/components/account-delete-button'
import { OVERAGE_PRICE } from '@/app/lib/constants'

export default async function AccountPage() {
  const user = await getUser()
  const userProfile = await fetchUserProfile(user.id)

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
      <SubscriptionManager userProfile={userProfile} />

      {/* Usage Tracking */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">Usage Tracking</h2>
        <p className="text-sm text-muted-foreground mb-4">Monthly usage statistics</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-muted p-4 rounded-lg min-w-0">
            <h3 className="text-lg font-medium text-foreground mb-2 break-words">Total Requests</h3>
            <p className="text-2xl font-bold text-primary">
              {userProfile?.requests_month || 0}
            </p>
            <p className="text-sm text-muted-foreground">requests this month</p>
          </div>
          <div className="bg-muted p-4 rounded-lg min-w-0">
            <h3 className="text-lg font-medium text-foreground mb-2 break-words">Perplexity</h3>
            <p className="text-2xl font-bold text-primary">
              {userProfile?.perplexity_usage_month || 0}
            </p>
            <p className="text-sm text-muted-foreground">searches this month</p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg min-w-0">
            <h3 className="text-lg font-medium text-foreground mb-2 break-words">Textbelt</h3>
            <p className="text-2xl font-bold text-primary">
              {userProfile?.textbelt_usage_month || 0}
            </p>
            <p className="text-sm text-muted-foreground">messages this month</p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg min-w-0">
            <h3 className="text-lg font-medium text-foreground mb-2 break-words">XAI Live Search</h3>
            <p className="text-2xl font-bold text-primary">
              {userProfile?.xai_live_search_month || 0}
            </p>
            <p className="text-sm text-muted-foreground">searches this month</p>
          </div>
        </div>
        
        {/* Overage Pricing Notice */}
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Request and usage based service overage is ${OVERAGE_PRICE} per use over limits
          </p>
        </div>
      </div>

      {/* Max Usage Based Pricing */}
      <MaxUbpSetting userProfile={userProfile} />

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
            <AccountDeleteButton />
          </div>
        </div>
      </div>
      
      {/* Legal Links */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            <a 
              href="https://www.juniperassistant.com/terms-of-use" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Terms of Use
            </a>
            {' '}•{' '}
            <a 
              href="https://www.juniperassistant.com/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}