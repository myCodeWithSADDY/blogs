import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState  } from 'react'
import type {ReactNode} from 'react';
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { RichEditor } from '@/components/admin/RichEditor'
import { RichContent } from '@/components/site/RichContent'
import { useStaff, uploadImage } from '@/lib/staff'
import { docToText, readingTime, slugify } from '@/lib/site'
import { Field } from '@/routes/auth'

export const Route = createFileRoute('/_authenticated/admin/articles/$id')({
  component: ArticleEditor,
})

type Form = {
  title: string
  slug: string
  excerpt: string
  content: any
  featured_image_url: string
  featured_image_alt: string
  category_id: string
  author_id: string
  status: string
  published_at: string | null
  seo_title: string
  seo_description: string
  featured: boolean
  tagIds: string[]
  areaIds: string[]
}

const EMPTY: Form = {
  title: '',
  slug: '',
  excerpt: '',
  content: { type: 'doc', content: [] },
  featured_image_url: '',
  featured_image_alt: '',
  category_id: '',
  author_id: '',
  status: 'DRAFT',
  published_at: null,
  seo_title: '',
  seo_description: '',
  featured: false,
  tagIds: [],
  areaIds: [],
}

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

function ArticleEditor() {
  const { id } = Route.useParams()
  const isNew = id === 'new'
  const staff = useStaff()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [f, setF] = useState<Form | null>(isNew ? EMPTY : null)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [schedule, setSchedule] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)

  const lookups = useQuery({
    queryKey: ['editor-lookups'],
    queryFn: async () => {
      const [c, a, t, ar] = await Promise.all([
        supabase.from('categories').select('id,name').order('display_order'),
        supabase.from('authors').select('id,name').order('name'),
        supabase.from('tags').select('id,name').order('name'),
        supabase.from('areas').select('id,name,city').order('name'),
      ])
      return {
        categories: c.data ?? [],
        authors: a.data ?? [],
        tags: t.data ?? [],
        areas: ar.data ?? [],
      }
    },
  })

  useEffect(() => {
    if (isNew) return
    ;(async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*, article_tags(tag_id), article_areas(area_id)')
        .eq('id', id)
        .maybeSingle()
      if (error || !data) {
        toast.error('Article not found')
        navigate({ to: '/admin' })
        return
      }
      setF({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featured_image_url: data.featured_image_url ?? '',
        featured_image_alt: data.featured_image_alt,
        category_id: data.category_id,
        author_id: data.author_id,
        status: data.status,
        published_at: data.published_at,
        seo_title: data.seo_title ?? '',
        seo_description: data.seo_description ?? '',
        featured: data.featured,
        tagIds: (data.article_tags as any[]).map((x) => x.tag_id),
        areaIds: (data.article_areas as any[]).map((x) => x.area_id),
      })
      setSchedule(toLocalInput(data.published_at))
    })()
  }, [id, isNew, navigate])

  if (!f || lookups.isLoading)
    return <p className="text-sm text-meta">Loading article…</p>
  const L = lookups.data!
  const set = (patch: Partial<Form>) => setF({ ...f, ...patch })
  const canPublish = staff.canEdit

  async function save(
    mode: 'draft' | 'publish' | 'schedule' | 'unpublish' | 'archive' | 'keep',
  ) {
    if (!f) return
    if (!f.title.trim() || !f.excerpt.trim())
      return toast.error('Headline and summary are required.')
    if (!f.category_id || !f.author_id)
      return toast.error('Choose a section and an author.')
    const slug = slugify(f.slug || f.title)
    if (!slug) return toast.error('Slug is invalid.')
    let status = f.status
    let published_at = f.published_at
    if (mode === 'draft' || mode === 'unpublish') {
      status = 'DRAFT'
    }
    if (mode === 'archive') status = 'ARCHIVED'
    if (mode === 'publish') {
      status = 'PUBLISHED'
      published_at = new Date().toISOString()
    }
    if (mode === 'schedule') {
      if (!schedule) return toast.error('Pick a publication date and time.')
      const when = new Date(schedule)
      if (when <= new Date())
        return toast.error('Scheduled time must be in the future.')
      status = 'PUBLISHED'
      published_at = when.toISOString()
    }
    const text = docToText(f.content)
    const row = {
      title: f.title.trim(),
      slug,
      excerpt: f.excerpt.trim(),
      content: f.content,
      content_text: text,
      reading_time: readingTime(text),
      featured_image_url: f.featured_image_url || null,
      featured_image_alt: f.featured_image_alt,
      category_id: f.category_id,
      author_id: f.author_id,
      status: status as any,
      published_at,
      scheduled_at: mode === 'schedule' ? published_at : null,
      seo_title: f.seo_title || null,
      seo_description: f.seo_description || null,
      featured: f.featured,
    }
    setBusy(true)
    try {
      let articleId = id
      if (isNew) {
        const { data, error } = await supabase
          .from('articles')
          .insert({ ...row, created_by: staff.userId })
          .select('id')
          .single()
        if (error) throw error
        articleId = data.id
      } else {
        const { error } = await supabase
          .from('articles')
          .update(row)
          .eq('id', id)
        if (error) throw error
      }
      await supabase.from('article_tags').delete().eq('article_id', articleId)
      if (f.tagIds.length) {
        const { error } = await supabase
          .from('article_tags')
          .insert(f.tagIds.map((tag_id) => ({ article_id: articleId, tag_id })))
        if (error) throw error
      }
      await supabase.from('article_areas').delete().eq('article_id', articleId)
      if (f.areaIds.length) {
        const { error } = await supabase
          .from('article_areas')
          .insert(
            f.areaIds.map((area_id) => ({ article_id: articleId, area_id })),
          )
        if (error) throw error
      }
      setF({ ...f, slug, status, published_at })
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      toast.success(
        mode === 'publish'
          ? 'Published.'
          : mode === 'schedule'
            ? 'Scheduled.'
            : mode === 'unpublish'
              ? 'Unpublished — now a draft.'
              : mode === 'archive'
                ? 'Archived.'
                : 'Saved.',
      )
      if (isNew)
        navigate({
          to: '/admin/articles/$id',
          params: { id: articleId },
          replace: true,
        })
    } catch (e: any) {
      toast.error(
        e.message?.includes('duplicate')
          ? 'That slug is already used by another article.'
          : (e.message ?? 'Could not save'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this article permanently?')) return
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) return toast.error(error.message)
    qc.invalidateQueries({ queryKey: ['admin-articles'] })
    toast.success('Deleted.')
    navigate({ to: '/admin' })
  }

  async function upload(file: File) {
    const m = await uploadImage(file, staff.userId)
    return m.public_url
  }

  const live =
    f.status === 'PUBLISHED' &&
    f.published_at &&
    new Date(f.published_at) <= new Date()
  const scheduled =
    f.status === 'PUBLISHED' &&
    f.published_at &&
    new Date(f.published_at) > new Date()
  const statusLabel = scheduled
    ? 'Scheduled'
    : f.status.charAt(0) + f.status.slice(1).toLowerCase()
  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-4">
        <div>
          <Link to="/admin" className="text-xs text-ink-soft hover:text-ink">
            ← All articles
          </Link>
          <h1 className="font-display mt-1 text-3xl">
            {isNew ? 'New article' : 'Edit article'}
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-meta">
            Status: <span className="text-ink">{statusLabel}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            onClick={() => setPreview(!preview)}
            className="border border-rule px-4 py-2 text-ink-soft hover:border-ink"
          >
            {preview ? 'Back to editing' : 'Preview'}
          </button>
          {live && (
            <a
              href={`/article/${f.slug}`}
              target="_blank"
              rel="noreferrer"
              className="border border-rule px-4 py-2 text-ink-soft hover:border-ink"
            >
              View live
            </a>
          )}
          <button
            disabled={busy}
            onClick={() =>
              save(f.status === 'DRAFT' || isNew ? 'draft' : 'keep')
            }
            className="border border-ink px-4 py-2 hover:bg-card disabled:opacity-50"
          >
            {f.status === 'DRAFT' || isNew ? 'Save draft' : 'Save changes'}
          </button>
          {canPublish && !live && (
            <button
              disabled={busy}
              onClick={() => save('publish')}
              className="bg-ink px-4 py-2 font-medium text-paper hover:bg-ink-soft disabled:opacity-50"
            >
              Publish now
            </button>
          )}
          {canPublish && (live || scheduled) && (
            <button
              disabled={busy}
              onClick={() => save('unpublish')}
              className="border border-rule px-4 py-2 text-ink-soft hover:border-ink"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      {preview ? (
        <article className="mx-auto max-w-[720px] py-10">
          <p className="kicker text-brass-deep">
            {L.categories.find((c) => c.id === f.category_id)?.name ??
              'Section'}
          </p>
          <h1 className="font-display mt-3 text-5xl leading-[1.05]">
            {f.title || 'Untitled'}
          </h1>
          <p className="mt-4 text-xl text-ink-soft">{f.excerpt}</p>
          {f.featured_image_url && (
            <img
              src={f.featured_image_url}
              alt={f.featured_image_alt}
              className="mt-8 w-full"
            />
          )}
          <div className="prose-editorial mt-8">
            <RichContent doc={f.content} />
          </div>
        </article>
      ) : (
        <div className="grid gap-8 py-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Field label="Headline">
              <input
                value={f.title}
                onChange={(e) =>
                  set({
                    title: e.target.value,
                    ...(slugTouched ? {} : { slug: slugify(e.target.value) }),
                  })
                }
                className="admin-input font-display text-2xl"
                placeholder="Where Lahore's property market is moving"
              />
            </Field>
            <Field
              label="Summary / deck"
              hint="Shown under the headline and on story listings."
            >
              <textarea
                value={f.excerpt}
                onChange={(e) => set({ excerpt: e.target.value })}
                rows={2}
                className="admin-input"
              />
            </Field>
            <RichEditor
              key={isNew ? 'new' : id}
              content={f.content}
              onChange={(doc) => set({ content: doc })}
              onUpload={upload}
            />
          </div>

          <aside className="space-y-6 text-sm">
            <Panel title="Publishing">
              <Field label="Slug" hint={`/article/${f.slug || '…'}`}>
                <input
                  value={f.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    set({ slug: e.target.value })
                  }}
                  className="admin-input"
                />
              </Field>
              {canPublish && (
                <div className="mt-4">
                  <Field label="Schedule for">
                    <input
                      type="datetime-local"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      className="admin-input"
                    />
                  </Field>
                  <button
                    disabled={busy}
                    onClick={() => save('schedule')}
                    className="mt-2 w-full border border-brass bg-brass/30 py-2 hover:bg-brass/50"
                  >
                    Schedule publication
                  </button>
                </div>
              )}
              <label className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.featured}
                  onChange={(e) => set({ featured: e.target.checked })}
                />{' '}
                Feature on homepage
              </label>
              {!isNew && (
                <div className="mt-4 flex justify-between border-t border-rule pt-3 text-xs">
                  {canPublish && f.status !== 'ARCHIVED' && (
                    <button
                      onClick={() => save('archive')}
                      className="text-ink-soft hover:text-ink"
                    >
                      Archive
                    </button>
                  )}
                  <button
                    onClick={remove}
                    className="text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </div>
              )}
            </Panel>

            <Panel title="Section & byline">
              <Field label="Section">
                <select
                  value={f.category_id}
                  onChange={(e) => set({ category_id: e.target.value })}
                  className="admin-input"
                >
                  <option value="">Choose…</option>
                  {L.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="mt-3">
                <Field label="Author">
                  <select
                    value={f.author_id}
                    onChange={(e) => set({ author_id: e.target.value })}
                    className="admin-input"
                  >
                    <option value="">Choose…</option>
                    {L.authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Panel>

            <Panel title="Lead image">
              {f.featured_image_url && (
                <img
                  src={f.featured_image_url}
                  alt=""
                  className="mb-3 aspect-[3/2] w-full object-cover"
                />
              )}
              <input
                type="file"
                accept="image/*"
                className="text-xs"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    set({ featured_image_url: await upload(file) })
                    toast.success('Image uploaded.')
                  } catch (er: any) {
                    toast.error(er.message)
                  }
                }}
              />
              <div className="mt-3">
                <Field label="Alt text">
                  <input
                    value={f.featured_image_alt}
                    onChange={(e) =>
                      set({ featured_image_alt: e.target.value })
                    }
                    className="admin-input"
                  />
                </Field>
              </div>
            </Panel>

            <Panel title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {L.tags.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set({ tagIds: toggle(f.tagIds, t.id) })}
                    className={`border px-2 py-0.5 text-xs ${f.tagIds.includes(t.id) ? 'border-ink bg-ink text-paper' : 'border-rule text-ink-soft'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Areas">
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {L.areas.map((a) => (
                  <label key={a.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={f.areaIds.includes(a.id)}
                      onChange={() => set({ areaIds: toggle(f.areaIds, a.id) })}
                    />{' '}
                    {a.name} <span className="text-meta">· {a.city}</span>
                  </label>
                ))}
              </div>
            </Panel>

            <Panel title="Search & sharing">
              <Field
                label="SEO title"
                hint={`${(f.seo_title || f.title).length}/60`}
              >
                <input
                  value={f.seo_title}
                  onChange={(e) => set({ seo_title: e.target.value })}
                  className="admin-input"
                  placeholder={f.title}
                />
              </Field>
              <div className="mt-3">
                <Field
                  label="SEO description"
                  hint={`${(f.seo_description || f.excerpt).length}/160`}
                >
                  <textarea
                    rows={3}
                    value={f.seo_description}
                    onChange={(e) => set({ seo_description: e.target.value })}
                    className="admin-input"
                    placeholder={f.excerpt}
                  />
                </Field>
              </div>
            </Panel>
          </aside>
        </div>
      )}
    </div>
  )
}

function Panel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-ink pt-3">
      <h2 className="kicker mb-3 text-brass-deep">{title}</h2>
      {children}
    </section>
  )
}
