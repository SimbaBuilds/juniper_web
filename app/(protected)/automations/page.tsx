import { getUser } from '@/lib/auth/get-user'
import { AutomationsClient } from '@/components/automations/AutomationsClient'

export default async function AutomationsPage() {
  const user = await getUser()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Automations</h1>
        <p className="text-muted-foreground">
          Manage your automated workflows. Pause, resume, edit, or manually trigger automations.
        </p>
      </div>

      <AutomationsClient userId={user.id} />
    </div>
  )
}
