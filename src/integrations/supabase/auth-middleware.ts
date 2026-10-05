import { createMiddleware } from '@tanstack/react-start'
import { supabase } from './client'

export const requireSupabaseAuth = createMiddleware({
  type: 'function',
}).server(async ({ next }) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return next({
    context: {
      userId: user.id,
      supabase,
    },
  })
})
