import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export function publicClient() {
  const url = process.env['SUPABASE_URL']
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']

  if (!url || !key) {
    throw new Error(
      `Missing Supabase environment variables: ${
        !url ? 'SUPABASE_URL ' : ''
      }${!key ? 'SUPABASE_PUBLISHABLE_KEY' : ''}`,
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storage: undefined,
    },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers)

        if (
          key.startsWith('sb_') &&
          headers.get('Authorization') === `Bearer ${key}`
        ) {
          headers.delete('Authorization')
        }

        headers.set('apikey', key)

        return fetch(input, {
          ...init,
          headers,
        })
      },
    },
  })
}
