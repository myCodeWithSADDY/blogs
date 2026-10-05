import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { subscribe } from '@/lib/public.functions'

export function Newsletter() {
  const sub = useServerFn(subscribe)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  return (
    <section className="border-y border-ink py-14">
      <div className="mx-auto grid max-w-7xl items-end gap-8 px-5 md:grid-cols-2 md:px-8">
        <div>
          <p className="kicker text-brass-deep">The Weekly Brief</p>
          <h2 className="font-display mt-2 text-3xl font-medium leading-tight md:text-[2.5rem]">
            Property intelligence,{' '}
            <em className="font-normal">without the noise.</em>
          </h2>
          <p className="mt-3 max-w-md text-[0.95rem] text-ink-soft">
            One considered email each Friday: the numbers that moved, the
            policies that matter, and the places worth watching.
          </p>
        </div>
        {state === 'done' ? (
          <p className="font-display text-xl">
            Thank you. Your first brief arrives this Friday.
          </p>
        ) : (
          <form
            className="flex border-b border-ink"
            onSubmit={async (e) => {
              e.preventDefault()
              setState('busy')
              try {
                const r = await sub({ data: { email } })
                setState(r.ok ? 'done' : 'error')
              } catch {
                setState('error')
              }
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Email address"
              className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-meta"
            />
            <button
              disabled={state === 'busy'}
              className="bg-brass px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-brass"
            >
              {state === 'busy' ? '…' : 'Subscribe'}
            </button>
          </form>
        )}
        {state === 'error' && (
          <p className="text-sm text-destructive md:col-start-2">
            Please check the address and try again.
          </p>
        )}
      </div>
    </section>
  )
}
