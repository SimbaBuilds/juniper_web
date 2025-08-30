import { getUser } from '@/lib/auth/get-user'
import { getDashboardStats, fetchUserProfile } from '@/lib/services'

export default async function DashboardPage() {
  const user = await getUser()
  const [dashboardStats, userProfile] = await Promise.all([
    getDashboardStats(user.id),
    fetchUserProfile(user.id)
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.email}!</p>
      </div>

      {/* Membership Status */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Membership Status</h2>
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-foreground">Active Plan</span>
          <span className="text-sm text-muted-foreground">Pro Subscription</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Plan expires:</span>
            <span className="ml-2 text-foreground">Never</span>
          </div>
          <div>
            <span className="text-muted-foreground">Usage this month:</span>
            <span className="ml-2 text-foreground"><span className="text-number">{userProfile?.requests_month || 0}</span> requests</span>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Active Integrations</h3>
          <div className="text-number-lg mb-1">{dashboardStats.activeIntegrationsCount}</div>
          <p className="text-sm text-muted-foreground">Connected services</p>
        </div>
        
        {/* <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Automations</h3>
          <div className="text-number-lg mb-1">{dashboardStats.activeAutomationsCount}</div>
          <p className="text-sm text-muted-foreground">Active workflows</p>
        </div> */}
        
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Repository Items</h3>
          <div className="text-number-lg mb-1">{dashboardStats.resourcesCount}</div>
          <p className="text-sm text-muted-foreground">Total saved items</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Integrations</h3>
          <div className="space-y-3">
            {dashboardStats.recentIntegrations.length > 0 ? (
              dashboardStats.recentIntegrations.map((integration, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${integration.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm text-foreground">{integration.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {integration.lastUsed ? new Date(integration.lastUsed).toLocaleDateString() : 'Never used'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent integrations</p>
            )}
          </div>
          <a href="/integrations" className="text-primary hover:underline text-sm mt-4 inline-block">
            View all integrations →
          </a>
        </div>

        {/* <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Automations</h3>
          <div className="space-y-3">
            {dashboardStats.recentAutomations.length > 0 ? (
              dashboardStats.recentAutomations.map((automation, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${automation.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span className="text-sm text-foreground">{automation.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {automation.status === 'active' ? 'Running' : 'Inactive'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent automations</p>
            )}
          </div>
          <a href="/automations" className="text-primary hover:underline text-sm mt-4 inline-block">
            View all automations →
          </a>
        </div> */}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/integrations" className="bg-card p-6 rounded-lg border border-border hover:bg-accent transition-colors">
          <h3 className="text-lg font-semibold text-foreground mb-2">Manage Integrations</h3>
          <p className="text-sm text-muted-foreground">View and configure your connected services</p>
        </a>
        
        {/* <a href="/automations" className="bg-card p-6 rounded-lg border border-border hover:bg-accent transition-colors">
          <h3 className="text-lg font-semibold text-foreground mb-2">View Automations</h3>
          <p className="text-sm text-muted-foreground">Check your automated workflows</p>
        </a> */}
        
        <a href="/repository" className="bg-card p-6 rounded-lg border border-border hover:bg-accent transition-colors">
          <h3 className="text-lg font-semibold text-foreground mb-2">Browse Repository</h3>
          <p className="text-sm text-muted-foreground">Access your saved data and files</p>
        </a>
      </div>
    </div>
  )
}