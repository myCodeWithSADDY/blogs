import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { getArea } from '@/lib/public.functions'
import { SiteLayout, Container } from '@/components/site/SiteChrome'
import { StoryCard } from '@/components/site/Cards'

export const Route = createFileRoute('/areas/$slug')({
  loader: async ({ params }) => {
    const d = await getArea({ data: { slug: params.slug } })
    if (!d) throw notFound()
    return d
  },
  head: ({ loaderData }) => {
    const n = loaderData?.area.name ?? 'Area'
    const d =
      loaderData?.area.overview.slice(0, 155) || `Property guide to ${n}.`
    return {
      meta: [
        { title: `${n} Property Guide — MunafaEstate` },
        { name: 'description', content: d },
        { property: 'og:title', content: `${n} Property Guide — MunafaEstate` },
        { property: 'og:description', content: d },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    }
  },
  notFoundComponent: () => (
    <SiteLayout>
      <Container className="py-24">
        <h1 className="font-display text-4xl">Area not found</h1>
      </Container>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <Container className="py-24">This area didn't load.</Container>
    </SiteLayout>
  ),
  component: () => {
    const { area, articles, nearby } = Route.useLoaderData()
    const prices = Object.entries(
      (area.price_information ?? {}) as Record<string, string>,
    )
    return (
      <SiteLayout>
        <Container className="pt-12">
          <p className="kicker text-brass-deep">
            {area.city}, {area.province}
          </p>
          <h1 className="font-display mt-2 text-5xl font-medium md:text-7xl">
            {area.name}
          </h1>
          {area.hero_image_url && (
            <img
              src={area.hero_image_url}
              alt={area.name}
              className="mt-8 aspect-[21/9] w-full object-cover"
            />
          )}
          <div className="mt-10 grid gap-12 md:grid-cols-[1fr_300px]">
            <div className="prose-editorial max-w-[720px]">
              <p>{area.overview}</p>
              {area.market_summary && (
                <>
                  <h2>The market</h2>
                  <p>{area.market_summary}</p>
                </>
              )}
              {area.development_information && (
                <>
                  <h2>Development</h2>
                  <p>{area.development_information}</p>
                </>
              )}
            </div>
            <aside>
              {prices.length > 0 && (
                <>
                  <p className="kicker border-b border-ink pb-2">
                    Market Watch
                  </p>
                  <dl>
                    {prices.map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between border-b border-rule py-3 text-sm"
                      >
                        <dt className="capitalize text-muted-foreground">
                          {k}
                        </dt>
                        <dd className="font-medium">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
              {nearby.length > 0 && (
                <>
                  <p className="kicker mt-8 border-b border-ink pb-2">Nearby</p>
                  {nearby.map((n) => (
                    <Link
                      key={n.id}
                      to="/areas/$slug"
                      params={{ slug: n.slug }}
                      className="block border-b border-rule py-3 font-display text-lg"
                    >
                      {n.name}
                    </Link>
                  ))}
                </>
              )}
            </aside>
          </div>
          {articles.length > 0 && (
            <section className="mt-16 border-t-2 border-ink pt-3">
              <h2 className="font-display mb-8 text-2xl">
                Latest on {area.name}
              </h2>
              <div className="grid gap-8 md:grid-cols-3">
                {articles.map((a) => (
                  <StoryCard key={a.id} a={a} size="sm" />
                ))}
              </div>
            </section>
          )}
        </Container>
      </SiteLayout>
    )
  },
})
