import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

// Admin-only: list sign-in accounts with their editorial roles.
export const listStaffUsers = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'ADMIN',
    })
    if (!isAdmin) throw new Error('Forbidden')
    const { supabaseAdmin } =
      await import('@/integrations/supabase/client.server')
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 200,
    })
    if (error) throw new Error('Could not load users')
    const { data: roles } = await context.supabase
      .from('user_roles')
      .select('user_id, role')
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      roles: (roles ?? [])
        .filter((r) => r.user_id === u.id)
        .map((r) => r.role as string),
    }))
  })
