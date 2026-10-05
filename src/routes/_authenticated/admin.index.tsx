import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { formatDate } from '@/lib/site'

export const Route = createFileRoute('/_authenticated/admin/')({
  component: ArticlesList,
})

export function displayStatus(a: {
  status: string
  published_at: string | null
}) {
  if (
    a.status === 'PUBLISHED' &&
    a.published_at &&
    new Date(a.published_at) > new Date()
  )
    return 'SCHEDULED'
  return a.status
}

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: 'border-ink text-ink',
  SCHEDULED: 'border-brass bg-brass/30 text-ink',
  DRAFT: 'border-rule text-ink-soft',
  ARCHIVED: 'border-rule text-meta line-through',
}

function ArticlesList() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select(
          'id,title,slug,status,published_at,updated_at,featured,view_count,category:categories(name),author:authors(name)',
        )
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const rows = (data ?? []).filter(
    (a) =>
      (status === 'ALL' || displayStatus(a) === status) &&
      (!q || a.title.toLowerCase().includes(q.toLowerCase())),
  )

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-4">
        <div>
          <p className="kicker text-brass-deep">Desk</p>
          <h1 className="font-display text-4xl">Articles</h1>
        </div>
        <Link
          to="/admin/articles/$id"
          params={{ id: 'new' }}
          className="bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft"
        >
          New article
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3 py-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by headline…"
          className="admin-input max-w-xs"
        />
        <div className="flex gap-1 text-xs">
          {['ALL', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`border px-3 py-1.5 ${status === s ? 'border-ink bg-ink text-paper' : 'border-rule text-ink-soft hover:border-ink-soft'}`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-[11px] uppercase tracking-[0.12em] text-meta">
              <th className="py-2 pr-4 font-medium">Headline</th>
              <th className="py-2 pr-4 font-medium">Section</th>
              <th className="py-2 pr-4 font-medium">Author</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 text-right font-medium">Views</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="py-8 text-meta">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-meta">
                  No articles match.
                </td>
              </tr>
            )}
            {rows.map((a) => {
              const st = displayStatus(a)
              return (
                <tr key={a.id} className="border-b border-rule hover:bg-card">
                  <td className="py-3 pr-4">
                    <Link
                      to="/admin/articles/$id"
                      params={{ id: a.id }}
                      className="font-display text-[1.05rem] text-ink hover:underline"
                    >
                      {a.title}
                    </Link>
                    {a.featured && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-brass-deep">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">
                    {(a.category as any)?.name}
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">
                    {(a.author as any)?.name}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${STATUS_STYLE[st]}`}
                    >
                      {st}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-meta">
                    {formatDate(a.published_at ?? a.updated_at)}
                  </td>
                  <td className="py-3 text-right tabular-nums text-meta">
                    {a.view_count}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
