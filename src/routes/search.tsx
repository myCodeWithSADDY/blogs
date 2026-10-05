import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { searchArticles } from '@/lib/public.functions'
import { SiteLayout, Container } from '@/components/site/SiteChrome'
import { StoryRow } from '@/components/site/Cards'

export const Route = createFileRoute('/search')({
  validateSearch: (s) => z.object({ q: z.string().catch('') }).parse(s),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => searchArticles({ data: { q: deps.q.slice(0, 120) } }),
  head: () => ({
    meta: [
      { title: 'Search the archive — MunafaEstate' },
      {
        name: 'description',
        content:
          'Search MunafaEstate reporting by title, topic, author, tag or location.',
      },
      { property: 'og:title', content: 'Search — MunafaEstate' },
      {
        property: 'og:description',
        content: 'Search the MunafaEstate archive.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  errorComponent: () => (
    <SiteLayout>
      <Container className="py-24">Search didn't load.</Container>
    </SiteLayout>
  ),
  component: () => {
    const { q } = Route.useSearch()
    const { results } = Route.useLoaderData()
    return (
      <SiteLayout>
        <Container className="max-w-[860px] pt-12">
          <form className="border-b-2 border-ink">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search the archive"
              className="font-display w-full bg-transparent py-3 text-4xl outline-none placeholder:text-meta"
            />
          </form>
          <p className="kicker mt-4 text-meta">
            {q
              ? `${results.length} results for “${q}”`
              : 'Search by title, topic, author, tag or area'}
          </p>
          <div className="mt-6 divide-y divide-rule">
            {results.map((a) => (
              <div key={a.id} className="py-6">
                <StoryRow a={a} />
              </div>
            ))}
          </div>
        </Container>
      </SiteLayout>
    )
  },
})
