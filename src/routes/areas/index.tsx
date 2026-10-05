import { createFileRoute, Link } from '@tanstack/react-router'
import { listAreas } from '@/lib/public.functions'
import { SiteLayout, Container } from '@/components/site/SiteChrome'

export const Route = createFileRoute('/areas/')({
  loader: () => listAreas(),
  head: () => ({
    meta: [
      { title: 'Area Guides — MunafaEstate' },
      {
        name: 'description',
        content: 'City and neighbourhood property guides across Pakistan.',
      },
      { property: 'og:title', content: 'Area Guides — MunafaEstate' },
      {
        property: 'og:description',
        content: 'City and neighbourhood property guides across Pakistan.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  errorComponent: () => (
    <SiteLayout>
      <Container className="py-24">Area guides didn't load.</Container>
    </SiteLayout>
  ),
  component: () => {
    const areas = Route.useLoaderData()
    return (
      <SiteLayout>
        <Container className="pt-12">
          <h1 className="font-display border-b border-ink pb-6 text-5xl font-medium md:text-7xl">
            Area Guides
          </h1>
          <ul className="mt-6 grid md:grid-cols-2">
            {areas.map((a) => (
              <li key={a.id} className="border-b border-rule py-5 md:odd:pr-8">
                <Link
                  to="/areas/$slug"
                  params={{ slug: a.slug }}
                  className="group flex items-baseline justify-between gap-4"
                >
                  <span className="font-display text-2xl group-hover:text-ink-soft">
                    {a.name}
                  </span>
                  <span className="kicker text-meta">
                    {a.city}, {a.province}
                  </span>
                </Link>
                {a.market_summary && (
                  <p className="mt-1 text-sm text-ink-soft">
                    {a.market_summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Container>
      </SiteLayout>
    )
  },
})
