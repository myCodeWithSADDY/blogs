import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { getArticle, recordView } from '@/lib/public.functions'
import { SiteLayout, Container } from '@/components/site/SiteChrome'
import { RichContent } from '@/components/site/RichContent'
import { NumberedList, StoryCard } from '@/components/site/Cards'
import { absoluteUrl, formatDate } from '@/lib/site'

export const Route = createFileRoute('/articles/$slug')({
  loader: async ({ params }) => {
    const d = await getArticle({ data: { slug: params.slug } })
    if (!d) throw notFound()
    return d
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return {
        meta: [
          { title: 'Not found — MunafaEstate' },
          { name: 'robots', content: 'noindex' },
        ],
      }
    const a = loaderData.article
    const title = `${a.seo_title || a.title} — MunafaEstate`
    const desc = a.seo_description || a.excerpt
    const meta: any[] = [
      { title },
      { name: 'description', content: desc },
      { property: 'og:title', content: title },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'article' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ]
    return {
      meta,
      links: [{ rel: 'canonical', href: absoluteUrl(`/article/${a.slug}`) }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: a.title,
            description: desc,
            datePublished: a.published_at,
            dateModified: a.updated_at,
            author: { '@type': 'Person', name: a.author?.name },
            publisher: {
              '@type': 'Organization',
              name: 'MunafaEstate',
              url: 'https://munafaestate.com',
            },
          }),
        },
      ],
    }
  },
  notFoundComponent: () => (
    <SiteLayout>
      <Container className="py-24">
        <h1 className="font-display text-4xl">Article not found</h1>
      </Container>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <Container className="py-24">
        <h1 className="font-display text-4xl">This article didn't load</h1>
      </Container>
    </SiteLayout>
  ),
  component: ArticlePage,
})

function ArticlePage() {
  const { article: a, related, mostRead } = Route.useLoaderData()
  const rv = useServerFn(recordView)
  useEffect(() => {
    rv({ data: { articleId: a.id } }).catch(() => {})
  }, [a.id])
  return (
    <SiteLayout>
      <Container className="pt-12">
        <header className="mx-auto max-w-[860px] text-center">
          {a.category && (
            <Link
              to="/category/$slug"
              params={{ slug: a.category.slug }}
              className="kicker text-brass-deep"
            >
              {a.category.name}
            </Link>
          )}
          <h1 className="font-display mt-4 text-4xl font-medium leading-[1.05] md:text-6xl">
            {a.title}
          </h1>
          <p className="font-display mx-auto mt-5 max-w-[680px] text-xl text-ink-soft">
            {a.excerpt}
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            <span className="font-medium text-ink-soft">{a.author?.name}</span>{' '}
            · {formatDate(a.published_at)} · {a.reading_time} min read
          </p>
        </header>
        {a.featured_image_url && (
          <img
            src={a.featured_image_url}
            alt={a.featured_image_alt || a.title}
            className="mt-10 aspect-[16/9] w-full object-cover"
          />
        )}
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="mx-auto w-full max-w-[720px]">
            <RichContent doc={a.content} />
            <div className="mt-10 flex flex-wrap gap-3 border-t border-rule pt-5 text-xs">
              {(a.article_tags ?? []).map(
                (t: any) =>
                  t.tag && (
                    <Link
                      key={t.tag.slug}
                      to="/tag/$slug"
                      params={{ slug: t.tag.slug }}
                      className="text-ink-soft hover:text-ink"
                    >
                      #{t.tag.name}
                    </Link>
                  ),
              )}
              {(a.article_areas ?? []).map(
                (t: any) =>
                  t.area && (
                    <Link
                      key={t.area.slug}
                      to="/areas/$slug"
                      params={{ slug: t.area.slug }}
                      className="text-brass-deep"
                    >
                      {t.area.name}
                    </Link>
                  ),
              )}
            </div>
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-6">
              <NumberedList title="Most Read" items={mostRead} />
            </div>
          </aside>
        </div>
        {related.length > 0 && (
          <section className="mt-20 border-t-2 border-ink pt-3">
            <h2 className="font-display mb-8 text-2xl">Related Stories</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {related.map((r) => (
                <StoryCard key={r.id} a={r} size="sm" excerpt={false} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </SiteLayout>
  )
}
