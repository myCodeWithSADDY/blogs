import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { slugify } from '@/lib/site'

export type FieldDef = {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'checkbox'
  list?: boolean
  required?: boolean
}

/** Generic list + inline form editor for simple editorial lookup tables. */
export function CrudTable({
  table,
  title,
  kicker,
  fields,
  order = 'name',
}: {
  table: string
  title: string
  kicker: string
  fields: FieldDef[]
  order?: string
}) {
  const qc = useQueryClient()
  const [edit, setEdit] = useState<Record<string, any> | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['crud', table],
    queryFn: async () => {
      const { data, error } = await (supabase.from(table as any) as any)
        .select('*')
        .order(order)
      if (error) throw error
      return data as Record<string, any>[]
    },
  })

  async function save() {
    if (!edit) return
    for (const f of fields)
      if (f.required && !String(edit[f.key] ?? '').trim())
        return toast.error(`${f.label} is required.`)
    const row: Record<string, any> = {}
    for (const f of fields)
      row[f.key] =
        f.type === 'number'
          ? Number(edit[f.key] ?? 0)
          : f.type === 'checkbox'
            ? !!edit[f.key]
            : (edit[f.key] ?? '')
    row['slug'] = slugify(edit['slug'] || edit['name'] || '')
    const q = supabase.from(table as any) as any
    const { error } = edit['id']
      ? await q.update(row).eq('id', edit['id'])
      : await q.insert(row)
    if (error)
      return toast.error(
        error.message.includes('duplicate')
          ? 'That slug already exists.'
          : error.message,
      )
    toast.success('Saved.')
    setEdit(null)
    qc.invalidateQueries({ queryKey: ['crud', table] })
  }

  async function remove(id: string) {
    if (!confirm('Delete this item? Articles using it may block deletion.'))
      return
    const { error } = await (supabase.from(table as any) as any)
      .delete()
      .eq('id', id)
    if (error)
      return toast.error(
        'Could not delete — it is probably still used by articles.',
      )
    qc.invalidateQueries({ queryKey: ['crud', table] })
  }

  const listed = fields.filter((f) => f.list)
  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex items-end justify-between border-b border-ink pb-4">
        <div>
          <p className="kicker text-brass-deep">{kicker}</p>
          <h1 className="font-display text-4xl">{title}</h1>
        </div>
        <button
          onClick={() => setEdit({})}
          className="bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft"
        >
          Add new
        </button>
      </div>
      {edit && (
        <div className="my-6 grid gap-4 border border-rule bg-card p-5 md:grid-cols-2">
          {fields.map((f) => (
            <label
              key={f.key}
              className={
                f.type === 'textarea' ? 'block md:col-span-2' : 'block'
              }
            >
              <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
                {f.label}
              </span>
              {f.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={edit[f.key] ?? ''}
                  onChange={(e) =>
                    setEdit({ ...edit, [f.key]: e.target.value })
                  }
                  className="admin-input"
                />
              ) : f.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={!!edit[f.key]}
                  onChange={(e) =>
                    setEdit({ ...edit, [f.key]: e.target.checked })
                  }
                />
              ) : (
                <input
                  type={f.type ?? 'text'}
                  value={edit[f.key] ?? ''}
                  onChange={(e) =>
                    setEdit({ ...edit, [f.key]: e.target.value })
                  }
                  className="admin-input"
                />
              )}
            </label>
          ))}
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
              Slug
            </span>
            <input
              value={edit['slug'] ?? ''}
              placeholder={slugify(edit['name'] ?? '')}
              onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
              className="admin-input"
            />
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <button
              onClick={save}
              className="bg-ink px-5 py-2 text-sm text-paper"
            >
              Save
            </button>
            <button
              onClick={() => setEdit(null)}
              className="border border-rule px-5 py-2 text-sm text-ink-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-rule text-left text-[11px] uppercase tracking-[0.12em] text-meta">
            {listed.map((f) => (
              <th key={f.key} className="py-2 pr-4 font-medium">
                {f.label}
              </th>
            ))}
            <th className="py-2 pr-4 font-medium">Slug</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td className="py-6 text-meta">Loading…</td>
            </tr>
          )}
          {data?.length === 0 && (
            <tr>
              <td className="py-6 text-meta">Nothing here yet.</td>
            </tr>
          )}
          {data?.map((r) => (
            <tr key={r['id']} className="border-b border-rule hover:bg-card">
              {listed.map((f, i) => (
                <td
                  key={f.key}
                  className={`py-3 pr-4 ${i === 0 ? 'font-display text-[1.05rem]' : 'text-ink-soft'}`}
                >
                  {f.type === 'checkbox'
                    ? r[f.key]
                      ? 'Yes'
                      : '—'
                    : String(r[f.key] ?? '')}
                </td>
              ))}
              <td className="py-3 pr-4 text-meta">{r['slug']}</td>
              <td className="py-3 text-right text-xs">
                <button
                  onClick={() => setEdit(r)}
                  className="mr-3 text-ink-soft hover:text-ink"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(r['id'])}
                  className="text-destructive hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
