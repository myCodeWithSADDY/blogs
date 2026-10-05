import { Link, useNavigate } from '@tanstack/react-router'
import { useState  } from 'react'
import type {ReactNode} from 'react';
import {
  DotsThreeOutlineVerticalIcon,
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react'
import { NAV } from '@/lib/site'

function Masthead() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="border-b border-ink">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex items-center justify-between border-b border-rule py-2 text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">{today}</span>
          <span className="sm:hidden">Pakistan property journal</span>
          <div className="flex items-center gap-5">
            <Link to="/areas" className="hover:text-ink">
              Area Guides
            </Link>
            <Link to="/admin" className="hover:text-ink">
              Editors
            </Link>
          </div>
        </div>
        <div className="flex items-center justify-between py-5 md:py-7">
          <button
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <XIcon className="h-5 w-5" />
            ) : (
              <DotsThreeOutlineVerticalIcon className="h-5 w-5" />
            )}
          </button>
          <Link
            to="/"
            className="font-display text-[1.9rem] font-semibold tracking-[0.02em] leading-none text-ink md:text-[2.9rem]"
          >
            MUNAFA<span className="font-normal italic">ESTATE</span>
          </Link>
          <p className="hidden max-w-55 text-right text-xs leading-snug text-muted-foreground md:block">
            Independent reporting and analysis on Pakistan's property market.
          </p>
          <button
            className="md:hidden"
            aria-label="Search"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="hidden items-center justify-between border-t border-rule md:flex">
          <ul className="flex">
            <li>
              <Link
                to="/"
                activeOptions={{ exact: true }}
                className="relative block py-3 pr-6 text-[13px] font-medium text-ink-soft hover:text-ink"
                activeProps={{ className: 'text-ink' }}
              >
                Home
              </Link>
            </li>
            {NAV.map((n) => (
              <li key={n.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: n.slug }}
                  className="block border-t-2 border-transparent py-3 pr-6 text-[13px] font-medium text-ink-soft hover:text-ink"
                  activeProps={{ className: '!border-brass text-ink' }}
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/areas"
                className="block border-t-2 border-transparent py-3 pr-6 text-[13px] font-medium text-ink-soft hover:text-ink"
                activeProps={{ className: '!border-brass text-ink' }}
              >
                Areas
              </Link>
            </li>
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              navigate({ to: '/search', search: { q } })
            }}
            className="flex items-center gap-2 border-l border-rule py-2 pl-4"
          >
            <MagnifyingGlassIcon className="h-3.5 w-3.5 text-meta" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the archive"
              className="w-44 bg-transparent text-[13px] outline-none placeholder:text-meta"
              aria-label="Search articles"
            />
          </form>
        </nav>
        {searchOpen && (
          <form
            className="border-t border-rule py-3 md:hidden"
            onSubmit={(e) => {
              e.preventDefault()
              setSearchOpen(false)
              navigate({ to: '/search', search: { q } })
            }}
          >
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the archive"
              className="w-full bg-transparent py-1 text-base outline-none"
            />
          </form>
        )}
        {open && (
          <nav className="border-t border-rule pb-4 md:hidden">
            {[...NAV.map((n) => ({ label: n.label, slug: n.slug }))].map(
              (n) => (
                <Link
                  key={n.slug}
                  to="/category/$slug"
                  params={{ slug: n.slug }}
                  onClick={() => setOpen(false)}
                  className="block border-b border-rule py-3 font-display text-xl"
                >
                  {n.label}
                </Link>
              ),
            )}
            <Link
              to="/areas"
              onClick={() => setOpen(false)}
              className="block py-3 font-display text-xl"
            >
              Areas
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-ink bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <p className="font-display text-3xl font-semibold tracking-[0.02em]">
            MUNAFA<span className="font-normal italic">ESTATE</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-meta">
            An independent publication on Pakistan real estate: markets, policy,
            development and the places people live.
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="kicker text-brass">Sections</p>
          <ul className="mt-4 space-y-2 text-sm text-meta">
            {NAV.map((n) => (
              <li key={n.slug}>
                <Link
                  to="/category/$slug"
                  params={{ slug: n.slug }}
                  className="hover:text-paper"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="kicker text-brass">Areas</p>
          <ul className="mt-4 space-y-2 text-sm text-meta">
            {[
              ['lahore', 'Lahore'],
              ['islamabad', 'Islamabad'],
              ['karachi', 'Karachi'],
              ['dha-lahore', 'DHA Lahore'],
            ].map(([s, n]) => (
              <li key={s}>
                <Link
                  to="/areas/$slug"
                  params={{ slug: s }}
                  className="hover:text-paper"
                >
                  {n}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-soft">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-5 py-5 text-xs text-meta md:px-8">
          <span>
            © {new Date().getFullYear()} MunafaEstate. munafaestate.com
          </span>
          <span>Nothing published here is investment advice.</span>
        </div>
      </div>
    </footer>
  )
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <Masthead />
      <main>{children}</main>
      <Footer />
    </div>
  )
}

export function SectionHead({
  title,
  to,
  kicker,
}: {
  title: string
  to?: ReactNode
  kicker?: string
}) {
  return (
    <div className="mb-8 flex items-end justify-between border-t-2 border-ink pt-3">
      <div>
        {kicker && <p className="kicker mb-1 text-brass-deep">{kicker}</p>}
        <h2 className="font-display text-2xl font-medium md:text-[1.75rem]">
          {title}
        </h2>
      </div>
      {to}
    </div>
  )
}

export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mx-auto max-w-7xl px-5 md:px-8 ${className}`}>
      {children}
    </div>
  )
}
