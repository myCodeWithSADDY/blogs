import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCategory } from '@/lib/public.functions'
import { SiteLayout, Container } from '@/components/site/SiteChrome'
import { StoryCard } from '@/components/site/Cards'

export const Route = createFileRoute('/category/$slug')({
  loader: async ({ params }) => {
    const d = await getCategory({ data: { slug: params.slug, page: 1 } })
    if (!d) throw notFound()
    return d
  },
  head: ({ loaderData }) => {
    const n = loaderData?.category.name ?? 'Section'
    const d =
      loaderData?.category.description || `${n} coverage from MunafaEstate.`
    return {
      meta: [
        { title: `${n} — MunafaEstate` },
        { name: 'description', content: d },
        { property: 'og:title', content: `${n} — MunafaEstate` },
        { property: 'og:description', content: d },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    }
  },
  notFoundComponent: () => (
    <SiteLayout>
      <Container className="py-24">
        <h1 className="font-display text-4xl">Section not found</h1>
      </Container>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <Container className="py-24">
        <h1 className="font-display text-4xl">This section didn't load</h1>
      </Container>
    </SiteLayout>
  ),
  component: () => {
    const { category, articles } = Route.useLoaderData()
    const [lead, ...rest] = articles
    return (
      <SiteLayout>
        <Container className="pt-12">
          <h1 className="font-display border-b border-ink pb-6 text-5xl font-medium md:text-7xl">
            {category.name}
          </h1>
          <p className="mt-4 max-w-2xl text-ink-soft">{category.description}</p>
          <div className="mt-10">
            <StoryCard a={lead} ratio="aspect-[21/9]" size="lg" />
          </div>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {rest.map((a) => (
              <StoryCard key={a.id} a={a} size="sm" />
            ))}
          </div>
          {!articles.length && (
            <p className="mt-10 text-muted-foreground">
              No stories published in this section yet.
            </p>
          )}
        </Container>
      </SiteLayout>
    )
  },
})
