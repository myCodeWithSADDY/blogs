export const SITE_URL = 'https://munafaestate.com'
export const SITE_NAME = 'MunafaEstate'

export const NAV = [
  { label: 'Property', slug: 'property' },
  { label: 'Market', slug: 'market' },
  { label: 'Investment', slug: 'investment' },
  { label: 'Guides', slug: 'guides' },
  { label: 'News', slug: 'news' },
] as const

export function formatDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function absoluteUrl(path: string) {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90)
}

// Extract plain text from a TipTap JSON doc (for search + reading time)
export function docToText(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  const inner = (node.content ?? [])
    .map(docToText)
    .join(node.type === 'doc' ? '\n' : ' ')
  return inner
}

export function readingTime(text: string) {
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 225))
}
