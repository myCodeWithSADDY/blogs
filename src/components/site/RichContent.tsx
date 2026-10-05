import type { ReactNode } from 'react'

type Node = {
  type: string
  text?: string
  attrs?: Record<string, any>
  marks?: { type: string; attrs?: any }[]
  content?: Node[]
}

function safeHref(h?: string) {
  if (!h) return '#'
  return /^(https?:|mailto:|\/)/i.test(h) ? h : '#'
}

function renderText(n: Node, key: number): ReactNode {
  let el: ReactNode = n.text
  for (const m of n.marks ?? []) {
    if (m.type === 'bold') el = <strong>{el}</strong>
    else if (m.type === 'italic') el = <em>{el}</em>
    else if (m.type === 'strike') el = <s>{el}</s>
    else if (m.type === 'code') el = <code>{el}</code>
    else if (m.type === 'underline') el = <u>{el}</u>
    else if (m.type === 'link') {
      const href = safeHref(m.attrs?.href)
      const ext = href.startsWith('http')
      el = (
        <a
          href={href}
          {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {el}
        </a>
      )
    }
  }
  return <span key={key}>{el}</span>
}

function kids(n: Node) {
  return (n.content ?? []).map((c, i) => render(c, i))
}

function render(n: Node, key: number): ReactNode {
  switch (n.type) {
    case 'text':
      return renderText(n, key)
    case 'paragraph':
      return <p key={key}>{kids(n)}</p>
    case 'heading': {
      const l = Math.min(Math.max(n.attrs?.['level'] ?? 2, 2), 4)
      const H = `h${l}` as 'h2'
      return <H key={key}>{kids(n)}</H>
    }
    case 'bulletList':
      return <ul key={key}>{kids(n)}</ul>
    case 'orderedList':
      return (
        <ol key={key} start={n.attrs?.['start'] ?? 1}>
          {kids(n)}
        </ol>
      )
    case 'listItem':
      return <li key={key}>{kids(n)}</li>
    case 'blockquote':
      return <blockquote key={key}>{kids(n)}</blockquote>
    case 'horizontalRule':
      return <hr key={key} />
    case 'hardBreak':
      return <br key={key} />
    case 'codeBlock':
      return (
        <pre key={key} className="overflow-x-auto bg-muted p-4 text-sm">
          <code>{kids(n)}</code>
        </pre>
      )
    case 'image':
      return (
        <figure key={key} className="my-10">
          <img
            src={n.attrs?.['src']}
            alt={n.attrs?.['alt'] ?? ''}
            loading="lazy"
          />
          {n.attrs?.['title'] && <figcaption>{n.attrs.title}</figcaption>}
        </figure>
      )
    case 'table':
      return (
        <div key={key} className="overflow-x-auto">
          <table>
            <tbody>{kids(n)}</tbody>
          </table>
        </div>
      )
    case 'tableRow':
      return <tr key={key}>{kids(n)}</tr>
    case 'tableHeader':
      return (
        <th key={key}>
          {(n.content ?? [])
            .flatMap((c) => c.content ?? [])
            .map((c, i) => render(c, i))}
        </th>
      )
    case 'tableCell':
      return (
        <td key={key}>
          {(n.content ?? [])
            .flatMap((c) => c.content ?? [])
            .map((c, i) => render(c, i))}
        </td>
      )
    case 'youtube': {
      const m = String(n.attrs?.['src'] ?? '').match(
        /(?:v=|youtu\.be\/|embed\/)([\w-]{11})/,
      )
      if (!m) return null
      return (
        <div key={key} className="aspect-video">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${m[1]}`}
            title="Embedded video"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )
    }
    default:
      return n.content ? <div key={key}>{kids(n)}</div> : null
  }
}

export function RichContent({ doc }: { doc: Node }) {
  return (
    <div className="prose-editorial">
      {(doc?.content ?? []).map((c, i) => render(c, i))}
    </div>
  )
}
