import { createFileRoute, notFound } from '@tanstack/react-router'
import { getTag } from '@/lib/public.functions'
import { SiteLayout, Container } from '@/components/site/SiteChrome'
import { StoryCard } from '@/components/site/Cards'

export const Route = createFileRoute('/tag/$slug')({
  loader: async ({ params }) => {
    const d = await getTag({ data: { slug: params.slug } })
    if (!d) throw notFound()
    return d
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.tag.name ?? 'Tag'} — MunafaEstate` },
      {
        name: 'description',
        content: `Stories tagged ${loaderData?.tag.name ?? ''}.`,
      },
      {
        property: 'og:title',
        content: `${loaderData?.tag.name ?? 'Tag'} — MunafaEstate`,
      },
      {
        property: 'og:description',
        content: 'Tagged stories from MunafaEstate.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <Container className="py-24">Tag not found.</Container>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <Container className="py-24">This page didn't load.</Container>
    </SiteLayout>
  ),
  component: () => {
    const { tag, articles } = Route.useLoaderData()
    return (
      <SiteLayout>
        <Container className="pt-12">
          <p className="kicker text-brass-deep">Tag</p>
          <h1 className="font-display border-b border-ink pb-6 text-5xl">
            {tag.name}
          </h1>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {articles.map((a) => (
              <StoryCard key={a.id} a={a} size="sm" />
            ))}
          </div>
        </Container>
      </SiteLayout>
    )
  },
})
