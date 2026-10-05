
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'

import { publicClient } from './supabase-public.server'

export const CARD_FIELDS =
  'id,title,slug,excerpt,featured_image_url,featured_image_alt,published_at,reading_time,featured,view_count,category:categories(name,slug),author:authors(name,slug)'

export type ArticleCard = {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image_url: string | null
  featured_image_alt: string
  published_at: string | null
  reading_time: number
  featured: boolean
  view_count: number
  category: { name: string; slug: string } | null
  author: { name: string; slug: string } | null
}

function published<T>(query: T) {
  return (query as any)
    .eq('status', 'PUBLISHED')
    .lte('published_at', new Date().toISOString())
}

async function byCategory(
  sb: ReturnType<typeof publicClient>,
  slug: string,
  limit: number,
) {
  const { data: category, error: categoryError } = await sb
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (categoryError || !category) {
    return [] as ArticleCard[]
  }

  const { data, error } = await published(
    sb.from('articles').select(CARD_FIELDS),
  )
    .eq('category_id', category.id)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('byCategory:', error)
    return []
  }

  return (data ?? []) as unknown as ArticleCard[]
}

export const getHome = createServerFn({ method: 'GET' }).handler(async () => {
  const sb = publicClient()

  const [
    { data: latest },
    { data: featured },
    market,
    investment,
    guides,
    { data: areas },
  ] = await Promise.all([
    published(sb.from('articles').select(CARD_FIELDS))
      .order('published_at', { ascending: false })
      .limit(12),

    published(sb.from('articles').select(CARD_FIELDS))
      .eq('featured', true)
      .order('published_at', { ascending: false })
      .limit(4),

    byCategory(sb, 'market', 4),
    byCategory(sb, 'investment', 4),
    byCategory(sb, 'guides', 4),

    sb
      .from('areas')
      .select(
        'id,name,slug,city,province,hero_image_url,featured,market_summary',
      )
      .order('featured', { ascending: false })
      .order('name')
      .limit(12),
  ])

  return {
    latest: (latest ?? []) as unknown as ArticleCard[],
    featured: (featured ?? []) as unknown as ArticleCard[],
    market,
    investment,
    guides,
    areas: areas ?? [],
  }
})

export const getArticle = createServerFn({ method: 'GET' })
  .validator((d: unknown) =>
    z.object({
      slug: z.string().min(1).max(200),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient()

    const { data: article } = await published(
      sb
        .from('articles')
        .select(
          `
            id,
            title,
            slug,
            excerpt,
            content,
            featured_image_url,
            featured_image_alt,
            published_at,
            updated_at,
            reading_time,
            seo_title,
            seo_description,
            category_id,
            category:categories(name,slug),
            author:authors(name,slug,bio,avatar_url),
            article_tags(tag:tags(name,slug)),
            article_areas(area:areas(name,slug))
          `,
        ),
    )
      .eq('slug', data.slug)
      .maybeSingle()

    if (!article) {
      return null
    }

    const [{ data: related }, { data: mostRead }, { data: latest }] =
      await Promise.all([
        published(sb.from('articles').select(CARD_FIELDS))
          .eq('category_id', article.category_id)
          .neq('id', article.id)
          .order('published_at', { ascending: false })
          .limit(3),

        published(sb.from('articles').select(CARD_FIELDS))
          .neq('id', article.id)
          .order('view_count', { ascending: false })
          .limit(5),

        published(sb.from('articles').select(CARD_FIELDS))
          .neq('id', article.id)
          .order('published_at', { ascending: false })
          .limit(4),
      ])

    return {
      article,
      related: (related ?? []) as unknown as ArticleCard[],
      mostRead: (mostRead ?? []) as unknown as ArticleCard[],
      latest: (latest ?? []) as unknown as ArticleCard[],
    }
  })

export const recordView = createServerFn({ method: 'POST' })
  .validator((d: unknown) =>
    z.object({
      articleId: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const req = getRequest()

    const raw = [
      req.headers.get('cf-connecting-ip') ?? '',
      req.headers.get('x-forwarded-for') ?? '',
      req.headers.get('user-agent') ?? '',
    ].join('|')

    const buf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(raw),
    )

    const visitorHash = Array.from(new Uint8Array(buf))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')

    const { error } = await publicClient().rpc(
      'increment_article_view',
      {
        _article_id: data.articleId,
        _visitor_hash: visitorHash,
      },
    )

    if (error) {
      console.error('recordView:', error)
      return { ok: false }
    }

    return { ok: true }
  })

const PAGE = 9

export const getCategory = createServerFn({ method: 'GET' })
  .validator((d: unknown) =>
    z.object({
      slug: z.string().max(100),
      page: z.number().int().min(1).max(500),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient()

    const { data: category } = await sb
      .from('categories')
      .select('id,name,slug,description')
      .eq('slug', data.slug)
      .maybeSingle()

    if (!category) {
      return null
    }

    const from = (data.page - 1) * PAGE

    const { data: articles, count } = await published(
      sb.from('articles').select(CARD_FIELDS, { count: 'exact' }),
    )
      .eq('category_id', category.id)
      .order('published_at', { ascending: false })
      .range(from, from + PAGE)

    const list = (articles ?? []) as unknown as ArticleCard[]

    return {
      category,
      articles: list.slice(0, PAGE),
      hasMore: list.length > PAGE,
      total: count ?? 0,
    }
  })

export const getTag = createServerFn({ method: 'GET' })
  .validator((d: unknown) =>
    z.object({
      slug: z.string().max(100),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient()

    const { data: tag } = await sb
      .from('tags')
      .select('id,name,slug')
      .eq('slug', data.slug)
      .maybeSingle()

    if (!tag) {
      return null
    }

    const { data: links } = await sb
      .from('article_tags')
      .select('article_id')
      .eq('tag_id', tag.id)

    const ids = (links ?? []).map((link) => link.article_id)

    if (!ids.length) {
      return {
        tag,
        articles: [] as ArticleCard[],
      }
    }

    const { data: articles } = await published(
      sb.from('articles').select(CARD_FIELDS),
    )
      .in('id', ids)
      .order('published_at', { ascending: false })

    return {
      tag,
      articles: (articles ?? []) as unknown as ArticleCard[],
    }
  })

export const listAreas = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { data } = await publicClient()
      .from('areas')
      .select(
        'id,name,slug,city,province,hero_image_url,market_summary,featured',
      )
      .order('city')
      .order('name')

    return data ?? []
  },
)

export const getArea = createServerFn({ method: 'GET' })
  .validator((d: unknown) =>
    z.object({
      slug: z.string().max(100),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient()

    const { data: area } = await sb
      .from('areas')
      .select('*')
      .eq('slug', data.slug)
      .maybeSingle()

    if (!area) {
      return null
    }

    const [{ data: links }, { data: nearby }] = await Promise.all([
      sb
        .from('article_areas')
        .select('article_id')
        .eq('area_id', area.id),

      area.nearby_area_ids.length
        ? sb
            .from('areas')
            .select('id,name,slug,city')
            .in('id', area.nearby_area_ids)
        : sb
            .from('areas')
            .select('id,name,slug,city')
            .eq('city', area.city)
            .neq('id', area.id)
            .limit(4),
    ])

    const ids = (links ?? []).map((link) => link.article_id)

    let articles: ArticleCard[] = []

    if (ids.length) {
      const { data } = await published(
        sb.from('articles').select(CARD_FIELDS),
      )
        .in('id', ids)
        .order('published_at', { ascending: false })

      articles = data ?? []
    }

    const guides = articles.filter(
      (article) => article.category?.slug === 'guides',
    )

    return {
      area,
      articles,
      guides,
      nearby: nearby ?? [],
    }
  })

export const searchArticles = createServerFn({ method: 'GET' })
  .validator((d: unknown) =>
    z.object({
      q: z.string().max(120),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const q = data.q
      .trim()
      .replace(/[%_,()]/g, ' ')
      .trim()

    if (q.length < 2) {
      return {
        results: [] as ArticleCard[],
      }
    }

    const sb = publicClient()
    const like = `%${q}%`

    const [cats, tags, authors, areas] = await Promise.all([
      sb.from('categories').select('id').ilike('name', like),
      sb.from('tags').select('id').ilike('name', like),
      sb.from('authors').select('id').ilike('name', like),
      sb
        .from('areas')
        .select('id')
        .or(`name.ilike.${like},city.ilike.${like}`),
    ])

    const tagIds = (tags.data ?? []).map((tag) => tag.id)
    const areaIds = (areas.data ?? []).map((area) => area.id)

    const [tagLinks, areaLinks] = await Promise.all([
      tagIds.length
        ? sb
            .from('article_tags')
            .select('article_id')
            .in('tag_id', tagIds)
        : Promise.resolve({
            data: [] as { article_id: string }[],
          }),

      areaIds.length
        ? sb
            .from('article_areas')
            .select('article_id')
            .in('area_id', areaIds)
        : Promise.resolve({
            data: [] as { article_id: string }[],
          }),
    ])

    const ors = [
      `title.ilike.${like}`,
      `excerpt.ilike.${like}`,
      `content_text.ilike.${like}`,
    ]

    const catIds = (cats.data ?? []).map((category) => category.id)
    const authorIds = (authors.data ?? []).map((author) => author.id)

    const articleIds = [
      ...(tagLinks.data ?? []),
      ...(areaLinks.data ?? []),
    ].map((link) => link.article_id)

    if (catIds.length) {
      ors.push(`category_id.in.(${catIds.join(',')})`)
    }

    if (authorIds.length) {
      ors.push(`author_id.in.(${authorIds.join(',')})`)
    }

    if (articleIds.length) {
      ors.push(`id.in.(${[...new Set(articleIds)].join(',')})`)
    }

    const { data: results } = await published(
      sb.from('articles').select(CARD_FIELDS),
    )
      .or(ors.join(','))
      .order('published_at', { ascending: false })
      .limit(40)

    return {
      results: (results ?? []) as unknown as ArticleCard[],
    }
  })

export const subscribe = createServerFn({ method: 'POST' })
  .validator((d: unknown) =>
    z.object({
      email: z.string().trim().email().max(255),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase()

    const { error } = await publicClient()
      .from('newsletter_subscribers')
      .insert({
        email,
        source: 'website',
      })

    if (error && !error.message.toLowerCase().includes('duplicate')) {
      console.error('subscribe:', error)
      return { ok: false }
    }

    return { ok: true }
  })

