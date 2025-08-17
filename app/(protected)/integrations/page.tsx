import { getUser } from '@/lib/auth/get-user'
import { fetchIntegrations } from '@/lib/services'
import { SERVICE_CATEGORIES, type IntegrationStatus } from '@/app/lib/integrations/constants'

function getStatusColor(status: IntegrationStatus['status']) {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'pending_setup':
      return 'bg-yellow-500';
    case 'disconnected':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

function getStatusText(status: IntegrationStatus['status']) {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'pending_setup':
      return 'Pending Setup';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Unknown';
  }
}

function getServiceCategory(serviceName: string): IntegrationStatus['category'] {
  const name = serviceName.toLowerCase();
  
  // Health and Wellness
  if (['oura', 'fitbit'].includes(name)) {
    return 'Health and Wellness';
  }
  
  // Email
  if (['gmail', 'microsoft outlook email', 'microsoft outlook mail', 'microsoft email'].includes(name)) {
    return 'Email';
  }
  
  // Communications
  if (['slack', 'microsoft teams', 'twilio', 'textbelt'].includes(name)) {
    return 'Team Collaboration';
  }
  
  // Productivity and Task Management
  if (['notion', 'todoist', 'any.do'].includes(name)) {
    return 'Task Management';
  }
  
  // Calendar
  if (['google calendar', 'microsoft outlook calendar', 'microsoft calendar'].includes(name)) {
    return 'Calendar';
  }
  
  // Video Conferencing
  if (['google meet'].includes(name)) {
    return 'Video Conferencing';
  }
  
  // Research
  if (['research', 'ai', 'search', 'perplexity'].includes(name)) {
    return 'Search';
  }
  
  // Cloud Storage
  if (['dropbox'].includes(name)) {
    return 'Cloud Storage';
  }
  
  // Cloud Text Documents
  if (['google docs', 'microsoft word online'].includes(name)) {
    return 'Cloud Text Documents';
  }
  
  // Cloud Spreadsheets
  if (['google sheets', 'microsoft excel online'].includes(name)) {
    return 'Cloud Spreadsheets';
  }
  
  // Default category for uncategorized services
  return 'Other';
}

function mapDatabaseIntegrationToDisplay(dbIntegration: { 
  status: string; 
  services?: { 
    service_name?: string; 
    description?: string; 
    public?: boolean; 
    type?: string;
    tag_1?: { name: string; type: string } | null;
    tag_2?: { name: string; type: string } | null;
    tag_3?: { name: string; type: string } | null;
    tag_4?: { name: string; type: string } | null;
    tag_5?: { name: string; type: string } | null;
  }; 
  last_used?: string 
}): IntegrationStatus {
  const statusMap: Record<string, IntegrationStatus['status']> = {
    'active': 'connected',
    'pending': 'pending_setup',
    'inactive': 'disconnected',
    'failed': 'disconnected'
  }
  
  const serviceName = dbIntegration.services?.service_name || 'Unknown Service';
  const category = getServiceCategory(serviceName);
  
  return {
    name: serviceName as IntegrationStatus['name'],
    status: statusMap[dbIntegration.status] || 'disconnected',
    lastConnected: dbIntegration.last_used ? new Date(dbIntegration.last_used).toLocaleDateString() : undefined,
    category: category,
    description: dbIntegration.services?.description || 'Service integration',
    public: dbIntegration.services?.public !== false,
    isSystemIntegration: dbIntegration.services?.type === 'system'
  }
}

export default async function IntegrationsPage() {
  const user = await getUser()
  const dbIntegrations = await fetchIntegrations(user.id)
  
  // Convert database integrations to display format
  const integrations = dbIntegrations.map(mapDatabaseIntegrationToDisplay)
  
  // Filter integrations to only show public ones
  const publicIntegrations = integrations.filter(integration => integration.public !== false);
  
  // Group integrations by their actual categories from the database
  const integrationsByCategory = publicIntegrations.reduce((acc, integration) => {
    const category = integration.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(integration)
    return acc
  }, {} as Record<string, typeof publicIntegrations>)

  // Define the order of categories (Health and Wellness first like in React Native)
  const categoryOrder = [
    'Health and Wellness',
    'Email',
    'Team Collaboration', 
    'Task Management',
    'Calendar',
    'Video Conferencing',
    'Cloud Storage',
    'Cloud Text Documents',
    'Cloud Spreadsheets',
    'Search',
    'Other'
  ];

  // Convert to the format expected by the template with ordered categories
  const integrationsCategorized = categoryOrder
    .map(categoryName => ({
      category: categoryName as keyof typeof SERVICE_CATEGORIES,
      integrations: integrationsByCategory[categoryName] || []
    }))
    .filter(group => group.integrations.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          View and monitor your connected services. Connect new services through the mobile app.
        </p>
      </div>

      {/* Prominent mobile app integration message */}
      <div className="bg-primary/10 border-2 border-primary rounded-lg p-6">
        <p className="text-lg font-semibold text-foreground text-center">
          Integrate with additional services in our mobile app
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Connected</h3>
          <div className="text-number-lg mb-1">
            {publicIntegrations.filter(i => i.status === 'connected').length}
          </div>
          <p className="text-sm text-muted-foreground">Active integrations</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Pending Setup</h3>
          <div className="text-number-lg mb-1">
            {publicIntegrations.filter(i => i.status === 'pending_setup').length}
          </div>
          <p className="text-sm text-muted-foreground">Awaiting completion</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Available</h3>
          <div className="text-number-lg mb-1">
            {publicIntegrations.filter(i => i.status === 'disconnected').length}
          </div>
          <p className="text-sm text-muted-foreground">Ready to connect</p>
        </div>
      </div>

      {/* Integration Categories */}
      <div className="space-y-8">
        {integrationsCategorized.map(({ category, integrations }) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="bg-card p-6 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`}></div>
                      <h3 className="text-lg font-semibold text-foreground">{integration.name}</h3>
                    </div>
                    {integration.isSystemIntegration && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">
                        System
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium text-foreground">{getStatusText(integration.status)}</span>
                    </div>
                    
                    {integration.lastConnected && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last active:</span>
                        <span className="text-foreground">{integration.lastConnected}</span>
                      </div>
                    )}
                  </div>

                  {/* Read-only status - no action buttons */}
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground text-center">
                      Use the mobile app to connect or manage this integration
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* System Integrations */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">System Integrations</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Built-in services that are always available to Juniper
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publicIntegrations
            .filter(integration => integration.isSystemIntegration)
            .map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(integration.status)}`}></div>
                  <div>
                    <h3 className="font-medium text-foreground">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}