import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useStaff, uploadImage } from '@/lib/staff'

export const Route = createFileRoute('/_authenticated/admin/media')({
  component: MediaLibrary,
})

function MediaLibrary() {
  const staff = useStaff()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
  const refresh = () => qc.invalidateQueries({ queryKey: ['media'] })

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex items-end justify-between border-b border-ink pb-4">
        <div>
          <p className="kicker text-brass-deep">Library</p>
          <h1 className="font-display text-4xl">Media</h1>
        </div>
        <label className="cursor-pointer bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft">
          Upload images
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? [])
              e.target.value = ''
              try {
                for (const f of files) await uploadImage(f, staff.userId)
                toast.success('Uploaded.')
              } catch (er: any) {
                toast.error(er.message)
              }
              refresh()
            }}
          />
        </label>
      </div>
      {isLoading && <p className="py-6 text-sm text-meta">Loading…</p>}
      {data?.length === 0 && (
        <p className="py-6 text-sm text-meta">No images uploaded yet.</p>
      )}
      <div className="grid grid-cols-2 gap-5 py-6 md:grid-cols-4">
        {data?.map((m) => (
          <figure key={m.id} className="border-b border-rule pb-3">
            <img
              src={m.public_url}
              alt={m.alt_text}
              loading="lazy"
              className="aspect-[4/3] w-full bg-card object-cover"
            />
            <figcaption className="mt-2 space-y-1 text-xs">
              <p className="truncate text-ink">{m.file_name}</p>
              <p className="text-meta">
                {m.width && m.height ? `${m.width}×${m.height} · ` : ''}
                {m.size_bytes ? `${Math.round(m.size_bytes / 1024)} KB` : ''}
              </p>
              <input
                defaultValue={m.alt_text}
                placeholder="Alt text"
                className="admin-input !py-1 text-xs"
                onBlur={async (e) => {
                  if (e.target.value === m.alt_text) return
                  const { error } = await supabase
                    .from('media')
                    .update({ alt_text: e.target.value })
                    .eq('id', m.id)
                  if (error) toast.error(error.message)
                  else toast.success('Alt text saved.')
                }}
              />
              <div className="flex justify-between pt-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(m.public_url)
                    toast.success('Link copied.')
                  }}
                  className="text-ink-soft hover:text-ink"
                >
                  Copy link
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('Delete this image?')) return
                    await supabase.storage
                      .from('editorial-media')
                      .remove([m.storage_path])
                    const { error } = await supabase
                      .from('media')
                      .delete()
                      .eq('id', m.id)
                    if (error) toast.error(error.message)
                    else refresh()
                  }}
                  className="text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
