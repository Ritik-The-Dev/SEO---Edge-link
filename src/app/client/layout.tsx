import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/dashboard/app-shell'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/client')
  if (user.role !== 'CLIENT') redirect('/app')

  return (
    <AppShell
      variant="client"
      user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
    >
      {children}
    </AppShell>
  )
}
