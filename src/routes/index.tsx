import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Container,
  SectionHead,
  SiteLayout,
} from '@/components/site/SiteChrome'
import { Byline, Img, Kicker, NumberedList, StoryCard, StoryRow, StoryText } from '@/components/site/Cards'
import { Newsletter } from '@/components/site/Newsletter'
import { getHome  } from '@/lib/public.functions'
import type {ArticleCard} from '@/lib/public.functions';
import { ArrowRight } from '@phosphor-icons/react'

export const Route = createFileRoute('/')({
  loader: () => getHome(),
  head: () => ({
    meta: [
      { title: 'MunafaEstate — Pakistan Property Intelligence' },
      {
        name: 'description',
        content:
          'Independent reporting, market analysis and practical guidance on Pakistan real estate.',
      },
      {
        property: 'og:title',
        content: 'MunafaEstate — Pakistan Property Intelligence',
      },
      {
        property: 'og:description',
        content:
          "Independent reporting and analysis on Pakistan's property market.",
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  errorComponent: () => (
    <SiteLayout>
      <Container className="py-24">
        <p className="kicker text-brass-deep">MunafaEstate</p>
        <h1 className="font-display mt-3 max-w-2xl text-5xl font-medium leading-none">
          The front page is being prepared.
        </h1>
        <p className="mt-5 text-ink-soft">
          Please return shortly for the latest property reporting.
        </p>
      </Container>
    </SiteLayout>
  ),
  component: HomePage,
})
function MoreLink({
  to,
  label = 'View all',
}: {
  to: '/areas' | '/category/$slug'
  label?: string
}) {
  if (to === '/areas') {
    return (
      <Link
        to="/areas"
        className="group flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink"
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    )
  }
  return null
}

function CategoryLink({
  slug,
  label = 'View section',
}: {
  slug: string
  label?: string
}) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug }}
      className="group flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

function FeatureStory({ article }: { article: ArticleCard }) {
  return (
    <article className="group">
      <Link
        to="/articles/$slug"
        params={{ slug: article.slug }}
        className="block"
      >
        <Img a={article} ratio="aspect-[16/10] md:aspect-[16/9]" eager />
      </Link>
      <div className="mt-5 max-w-4xl">
        <Kicker a={article} />
        <Link to="/articles/$slug" params={{ slug: article.slug }}>
          <h1 className="font-display mt-2 text-[2.65rem] font-medium leading-[0.98] text-ink group-hover:text-ink-soft sm:text-5xl md:text-[4.2rem]">
            {article.title}
          </h1>
        </Link>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft md:text-lg">
          {article.excerpt}
        </p>
        <div className="mt-4">
          <Byline a={article} />
        </div>
      </div>
    </article>
  )
}

function EmptyFrontPage() {
  return (
    <Container className="py-24">
      <p className="kicker text-brass-deep">The day ahead</p>
      <h1 className="font-display mt-3 max-w-3xl text-5xl font-medium leading-none md:text-7xl">
        Independent property reporting is on its way.
      </h1>
      <p className="mt-6 max-w-xl leading-relaxed text-ink-soft">
        Our editors are preparing the latest intelligence from Pakistan's
        property market.
      </p>
    </Container>
  )
}


function HomePage() {
  const { latest, featured, market, investment, guides, areas } =
    Route.useLoaderData()
  const lead = (featured[0] ?? latest[0]) as ArticleCard | undefined
  if (!lead)
    return (
      <SiteLayout>
        <EmptyFrontPage />
        <Newsletter />
      </SiteLayout>
    )

  const support =
    featured.length > 1
      ? featured.slice(1, 4)
      : latest.filter((a) => a.id !== lead.id).slice(0, 3)
  const marketLead = market[0]
  const investmentLead = investment[0]
  const latestUnique = latest.filter((a) => a.id !== lead.id).slice(0, 6)

  return (
    <SiteLayout>
      <Container className="pt-8 md:pt-11">
        <div className="mb-5 flex items-center justify-between border-t-2 border-ink pt-3">
          <p className="kicker text-ink">The Front Page</p>
          <p className="text-[11px] text-meta">
            Property · Markets · Policy · Places
          </p>
        </div>
        <section className="grid gap-9 border-b border-ink pb-12 lg:grid-cols-[minmax(0,2fr)_minmax(280px,0.78fr)] lg:gap-10">
          <FeatureStory article={lead} />
          <aside className="border-t border-ink lg:border-l lg:border-t-0 lg:pl-8">
            <p className="kicker py-4 text-brass-deep lg:pt-0">Also in focus</p>
            <div className="divide-y divide-rule border-t border-rule">
              {support.map((article, index) => (
                <div key={article.id} className="py-5">
                  {index === 0 && article.featured_image_url && (
                    <Link
                      to="/articles/$slug"
                      params={{ slug: article.slug }}
                      className="mb-4 block"
                    >
                      <Img a={article} ratio="aspect-[3/2]" />
                    </Link>
                  )}
                  <StoryText
                    a={article}
                    size={index === 0 ? 'md' : 'sm'}
                    excerpt={index === 0}
                  />
                </div>
              ))}
            </div>
          </aside>
        </section>
      </Container>

      <Container className="pt-16 md:pt-20">
          <SectionHead
            title="Market Intelligence"
            kicker="Data & analysis"
            to={<CategoryLink slug="market" />}
          />
          <section className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-7">
              <StoryCard a={marketLead} ratio="aspect-[16/10]" size="lg" />
            </div>
            <div className="divide-y divide-rule border-y border-ink md:col-span-5">
              {market.slice(1).map((article) => (
                <div key={article.id} className="py-5">
                  <StoryRow a={article} />
                </div>
              ))}
              {market.length === 1 && (
                <div className="py-8">
                  <p className="font-display text-2xl">
                    A measured view of the market, backed by reporting.
                  </p>
                </div>
              )}
            </div>
          </section>
      </Container>

      <>
        <section className="mt-20 border-y border-ink bg-ink text-paper">
          <Container className="py-12 md:py-16">
            <div className="mb-8 flex items-end justify-between border-t-2 border-paper pt-3">
              <div>
                <p className="kicker text-brass">Capital & opportunity</p>
                <h2 className="font-display mt-1 text-3xl font-medium md:text-4xl">
                  Investment
                </h2>
              </div>
              <Link
                to="/category/$slug"
                params={{ slug: 'investment' }}
                className="group flex items-center gap-2 text-xs font-semibold text-meta hover:text-paper"
              >
                View section
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid gap-9 lg:grid-cols-[1.3fr_0.7fr]">
              <article className="group grid gap-6 md:grid-cols-2">
                <Link
                  to="/articles/$slug"
                  params={{ slug: investmentLead.slug }}
                >
                  <Img a={investmentLead} ratio="aspect-[4/3]" />
                </Link>
                <div className="self-end">
                  <p className="kicker text-brass">Featured analysis</p>
                  <Link
                    to="/articles/$slug"
                    params={{ slug: investmentLead.slug }}
                  >
                    <h3 className="font-display mt-2 text-4xl font-medium leading-[1.02] group-hover:text-brass">
                      {investmentLead.title}
                    </h3>
                  </Link>
                  <p className="mt-4 text-sm leading-relaxed text-meta">
                    {investmentLead.excerpt}
                  </p>
                  <div className="mt-4 [&_p]:text-meta">
                    <Byline a={investmentLead} />
                  </div>
                </div>
              </article>
              <div className="divide-y divide-ink-soft border-y border-ink-soft">
                {investment.slice(1).map((article) => (
                  <Link
                    key={article.id}
                    to="/articles/$slug"
                    params={{ slug: article.slug }}
                    className="group block py-5"
                  >
                    <p className="font-display text-xl leading-tight group-hover:text-brass">
                      {article.title}
                    </p>
                    <p className="mt-2 text-xs text-meta">
                      {article.reading_time} min read
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </section>
      </>

      {guides.length > 0 && (
        <Container className="pt-16 md:pt-20">
          <SectionHead
            title="Property Guides"
            kicker="Clear answers"
            to={<CategoryLink slug="guides" />}
          />
          <div className="grid gap-x-7 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
            {guides.map((article, index) => (
              <StoryCard
                key={article.id}
                a={article}
                ratio={index === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'}
                size="sm"
                excerpt={index === 0}
              />
            ))}
          </div>
        </Container>
      )}

      {areas.length > 0 && (
        <Container className="pt-16 md:pt-20">
          <SectionHead
            title="Area Guides"
            kicker="Know the ground"
            to={<MoreLink to="/areas" label="Explore all areas" />}
          />
          <div className="grid border-y border-ink sm:grid-cols-2 lg:grid-cols-3">
            {areas.slice(0, 6).map((area, index) => (
              <Link
                key={area.id}
                to="/areas/$slug"
                params={{ slug: area.slug }}
                className="group relative min-h-44 border-b border-rule px-5 py-6 sm:odd:border-r lg:border-r lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-last-child(-n+3)]:border-b-0"
              >
                <span className="font-display text-5xl text-rule">
                  0{index + 1}
                </span>
                <div className="mt-7 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="font-display text-3xl leading-none group-hover:text-brass-deep">
                      {area.name}
                    </h3>
                    <p className="kicker mt-2 text-meta">
                      {area.city}, {area.province}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-meta transition-transform group-hover:translate-x-1 group-hover:text-ink" />
                </div>
              </Link>
            ))}
          </div>
        </Container>
      )}

      {latestUnique.length > 0 && (
        <Container className="py-16 md:py-20">
          <SectionHead title="Latest Stories" kicker="The latest" />
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.6fr)]">
            <div className="divide-y divide-rule border-y border-rule">
              {latestUnique.slice(0, 4).map((article) => (
                <div key={article.id} className="py-6">
                  <StoryRow a={article} />
                </div>
              ))}
            </div>
            <NumberedList items={latest.slice(0, 5)} title="Most Recent" />
          </div>
        </Container>
      )}
      <Newsletter />
    </SiteLayout>
  )
}
