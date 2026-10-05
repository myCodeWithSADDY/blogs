import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { listStaffUsers } from '@/lib/admin.functions'
import { useStaff  } from '@/lib/staff'
import type {Role} from '@/lib/staff';
import { formatDate } from '@/lib/site'

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: UsersPage,
})

const ROLES: Role[] = ['ADMIN', 'EDITOR', 'AUTHOR']

function UsersPage() {
  const staff = useStaff()
  const fetchUsers = useServerFn(listStaffUsers)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => fetchUsers(),
    enabled: staff.isAdmin,
  })

  if (!staff.isAdmin)
    return (
      <p className="text-sm text-meta">Only administrators can manage users.</p>
    )

  async function toggle(userId: string, role: Role, has: boolean) {
    if (has && userId === staff.userId && role === 'ADMIN')
      return toast.error("You can't remove your own admin role.")
    const { error } = has
      ? await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role)
      : await supabase.from('user_roles').insert({ user_id: userId, role })
    if (error) toast.error(error.message)
    else refetch()
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="border-b border-ink pb-4">
        <p className="kicker text-brass-deep">Access</p>
        <h1 className="font-display text-4xl">Users & roles</h1>
      </div>
      <p className="py-4 text-sm text-ink-soft">
        People create an account on the sign-in page, then appear here. Admins
        manage everything; editors publish and manage sections; authors write
        drafts.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-rule text-left text-[11px] uppercase tracking-[0.12em] text-meta">
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Joined</th>
            <th className="py-2 pr-4 font-medium">Last sign-in</th>
            <th className="py-2 font-medium">Roles</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td className="py-6 text-meta">Loading…</td>
            </tr>
          )}
          {data?.map((u) => (
            <tr key={u.id} className="border-b border-rule">
              <td className="py-3 pr-4 text-ink">{u.email}</td>
              <td className="py-3 pr-4 text-meta">
                {formatDate(u.created_at)}
              </td>
              <td className="py-3 pr-4 text-meta">
                {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : '—'}
              </td>
              <td className="py-3">
                <div className="flex gap-1">
                  {ROLES.map((r) => {
                    const has = u.roles.includes(r)
                    return (
                      <button
                        key={r}
                        onClick={() => toggle(u.id, r, has)}
                        className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${has ? 'border-ink bg-ink text-paper' : 'border-rule text-meta hover:border-ink-soft'}`}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
