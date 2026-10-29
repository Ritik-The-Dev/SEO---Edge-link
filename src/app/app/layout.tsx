import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components/dashboard/app-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/app')
  if (user.role !== 'ADMIN') redirect('/client')

  return (
    <AppShell
      variant="admin"
      user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
    >
      {children}
    </AppShell>
  )
}
