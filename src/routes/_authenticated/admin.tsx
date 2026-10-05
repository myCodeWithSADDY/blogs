import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { StaffContext   } from '@/lib/staff'
import type {Role, Staff} from '@/lib/staff';
import { Toaster } from '@/components/ui/sonner'

export const Route = createFileRoute('/_authenticated/admin')({
  head: () => ({
    meta: [
      { title: 'Editorial desk — MunafaEstate' },
      {
        name: 'description',
        content: 'Manage MunafaEstate articles, sections, areas and media.',
      },
      { property: 'og:title', content: 'Editorial desk — MunafaEstate' },
      {
        property: 'og:description',
        content: 'MunafaEstate content management.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AdminLayout,
})

const NAV: {
  to: string
  label: string
  adminOnly?: boolean
  editorOnly?: boolean
}[] = [
  { to: '/admin', label: 'Articles' },
  { to: '/admin/categories', label: 'Sections', editorOnly: true },
  { to: '/admin/tags', label: 'Tags', editorOnly: true },
  { to: '/admin/authors', label: 'Authors', editorOnly: true },
  { to: '/admin/areas', label: 'Areas', editorOnly: true },
  { to: '/admin/media', label: 'Media' },
  { to: '/admin/users', label: 'Users & roles', adminOnly: true },
]

function AdminLayout() {
  const { user } = Route.useRouteContext()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const {
    data: roles,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my-roles', user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
      return (data ?? []).map((r) => r.role as Role)
    },
  })

  async function signOut() {
    await qc.cancelQueries()
    qc.clear()
    await supabase.auth.signOut()
    navigate({ to: '/auth', replace: true })
  }

  if (isLoading)
    return (
      <div className="min-h-screen bg-paper p-10 text-sm text-meta">
        Loading the desk…
      </div>
    )

  if (!roles?.length) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="mx-auto max-w-[560px] px-6 pt-24">
          <p className="kicker text-brass-deep">Editorial desk</p>
          <h1 className="font-display mt-2 text-4xl text-ink">
            You don't have editorial access yet.
          </h1>
          <p className="mt-4 text-ink-soft">
            Signed in as {user.email}. Ask an administrator to assign you a
            role.
          </p>
          <p className="mt-2 text-sm text-meta">
            If this is a new publication with no administrator, you can claim
            the first admin seat.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={async () => {
                const { data } = await supabase.rpc('claim_first_admin')
                if (!data) alert('An administrator already exists.')
                refetch()
              }}
              className="bg-ink px-5 py-2.5 text-sm font-medium text-paper"
            >
              Claim admin seat
            </button>
            <button
              onClick={signOut}
              className="border border-rule px-5 py-2.5 text-sm text-ink-soft"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const staff: Staff = { userId: user.id, email: user.email ?? '', roles }
  const isAdmin = roles.includes('ADMIN')
  const canEdit = isAdmin || roles.includes('EDITOR')

  return (
    <StaffContext.Provider value={staff}>
      <div className="min-h-screen bg-paper text-ink">
        <header className="border-b border-ink">
          <div className="flex items-center justify-between px-5 py-3 md:px-8">
            <div className="flex items-baseline gap-4">
              <Link
                to="/"
                className="font-display text-xl font-semibold tracking-[0.02em]"
              >
                MUNAFA<span className="font-normal italic">ESTATE</span>
              </Link>
              <span className="hidden text-[11px] uppercase tracking-[0.14em] text-meta sm:inline">
                Editorial desk
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-soft">
              <span className="hidden md:inline">
                {user.email} · {roles.join(', ').toLowerCase()}
              </span>
              <button onClick={signOut} className="hover:text-ink">
                Sign out
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-rule px-3 md:px-6">
            {NAV.filter(
              (n) => (!n.adminOnly || isAdmin) && (!n.editorOnly || canEdit),
            ).map((n) => (
              <Link
                key={n.to}
                to={n.to as any}
                activeOptions={{ exact: n.to === '/admin' }}
                className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-[13px] text-ink-soft hover:text-ink"
                activeProps={{
                  className: '!border-brass text-ink font-medium',
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-5 py-8 md:px-8">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </StaffContext.Provider>
  )
}
