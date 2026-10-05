import { createFileRoute } from '@tanstack/react-router'

// Serves images from the private media library, only for files registered in the media table.
export const Route = createFileRoute('/media/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? ''
        if (!path || path.includes('..'))
          return new Response('Not found', { status: 404 })
        const { supabaseAdmin } =
          await import('@/integrations/supabase/client.server')
        const { data: row } = await supabaseAdmin
          .from('media')
          .select('mime_type')
          .eq('storage_path', path)
          .maybeSingle()
        if (!row) return new Response('Not found', { status: 404 })
        const { data, error } = await supabaseAdmin.storage
          .from('editorial-media')
          .download(path)
        if (error || !data) return new Response('Not found', { status: 404 })
        return new Response(data, {
          headers: {
            'content-type': row.mime_type,
            'cache-control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
