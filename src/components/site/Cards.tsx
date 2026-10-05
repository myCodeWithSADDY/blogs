import { Link } from '@tanstack/react-router'
import type { ArticleCard } from '@/lib/public.functions'
import { formatDate } from '@/lib/site'

export function Kicker({ a }: { a: ArticleCard }) {
  if (!a.category) return null
  return (
    <Link
      to="/category/$slug"
      params={{ slug: a.category.slug }}
      className="kicker text-brass-deep hover:text-ink"
    >
      {a.category.name}
    </Link>
  )
}

export function Byline({
  a,
  withTime = true,
}: {
  a: ArticleCard
  withTime?: boolean
}) {
  return (
    <p className="text-xs text-muted-foreground">
      {a.author && (
        <span className="font-medium text-ink-soft">{a.author.name}</span>
      )}
      {a.author && ' · '}
      {formatDate(a.published_at)}
      {withTime && ` · ${a.reading_time} min read`}
    </p>
  )
}

export function Img({
  a,
  ratio = 'aspect-[3/2]',
  eager = false,
}: {
  a: ArticleCard
  ratio?: string | undefined
  eager?: boolean
}) {
  if (!a.featured_image_url) return <div className={`${ratio} bg-muted`} />
  return (
    <div className={`${ratio} overflow-hidden bg-muted`}>
      <img
        src={a.featured_image_url}
        alt={a.featured_image_alt || a.title}
        loading={eager ? 'eager' : 'lazy'}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      />
    </div>
  )
}

function ArticleLink({
  a,
  children,
  className = '',
}: {
  a: ArticleCard
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link to="/articles/$slug" params={{ slug: a.slug }} className={className}>
      {children}
    </Link>
  )
}

/** Headline + excerpt, no image. Used in lists and sidebars. */
export function StoryText({
  a,
  size = 'md',
  excerpt = true,
}: {
  a: ArticleCard
  size?: 'sm' | 'md' | 'lg'
  excerpt?: boolean
}) {
  const h =
    size === 'lg'
      ? 'text-2xl md:text-[1.75rem]'
      : size === 'md'
        ? 'text-xl'
        : 'text-[1.05rem]'
  return (
    <article className="group">
      <Kicker a={a} />
      <ArticleLink a={a}>
        <h3
          className={`font-display mt-1.5 font-medium leading-[1.15] text-ink group-hover:text-ink-soft ${h}`}
        >
          {a.title}
        </h3>
      </ArticleLink>
      {excerpt && (
        <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-soft">
          {a.excerpt}
        </p>
      )}
      <div className="mt-2.5">
        <Byline a={a} />
      </div>
    </article>
  )
}

/** Image-led card */
export function StoryCard({
  a,
  ratio,
  size = 'md',
  excerpt = true,
}: {
  a: ArticleCard
  ratio?: string | undefined
  size?: 'sm' | 'md' | 'lg'
  excerpt?: boolean
}) {
  return (
    <div className="group">
      <ArticleLink a={a}>
        <Img a={a} ratio={ratio} />
      </ArticleLink>
      <div className="mt-4">
        <StoryText a={a} size={size} excerpt={excerpt} />
      </div>
    </div>
  )
}

/** Horizontal: thumbnail right */
export function StoryRow({ a }: { a: ArticleCard }) {
  return (
    <div className="group grid grid-cols-[1fr_96px] gap-4 md:grid-cols-[1fr_140px]">
      <StoryText a={a} size="sm" excerpt={false} />
      <ArticleLink a={a}>
        <Img a={a} ratio="aspect-square" />
      </ArticleLink>
    </div>
  )
}

export function NumberedList({
  items,
  title,
}: {
  items: ArticleCard[]
  title: string
}) {
  return (
    <div>
      <p className="kicker border-b border-ink pb-2 text-ink">{title}</p>
      <ol>
        {items.map((a, i) => (
          <li key={a.id} className="flex gap-4 border-b border-rule py-4">
            <span className="font-display text-2xl leading-none text-brass-deep">
              {i + 1}
            </span>
            <Link
              to="/articles/$slug"
              params={{ slug: a.slug }}
              className="font-display text-[1.05rem] leading-snug hover:text-ink-soft"
            >
              {a.title}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
