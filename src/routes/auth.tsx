import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Editors sign in — MunafaEstate' },
      {
        name: 'description',
        content: 'Sign in to the MunafaEstate editorial desk.',
      },
      { property: 'og:title', content: 'Editors sign in — MunafaEstate' },
      {
        property: 'og:description',
        content: 'Sign in to the MunafaEstate editorial desk.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'in' | 'up' | 'forgot'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate({ to: '/admin' })
      } else if (mode === 'up') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + '/auth' },
        })
        if (error) throw error
        if (data.session) navigate({ to: '/admin' })
        else setMsg('Check your inbox to confirm your email, then sign in.')
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        })
        if (error) throw error
        setMsg('If that address has an account, a reset link is on its way.')
      }
    } catch (e: any) {
      setErr(e.message ?? 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex max-w-[420px] flex-col px-6 pt-20">
        <Link
          to="/"
          className="font-display text-3xl font-semibold tracking-[0.02em] text-ink"
        >
          MUNAFA<span className="font-normal italic">ESTATE</span>
        </Link>
        <div className="mt-2 h-px w-12 bg-brass" />
        <p className="kicker mt-10 text-brass-deep">Editorial desk</p>
        <h1 className="font-display mt-2 text-4xl text-ink">
          {mode === 'in'
            ? 'Sign in'
            : mode === 'up'
              ? 'Create an account'
              : 'Reset password'}
        </h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
            />
          </Field>
          {mode !== 'forgot' && (
            <Field label="Password">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input"
              />
            </Field>
          )}
          {err && <p className="text-sm text-destructive">{err}</p>}
          {msg && (
            <p className="border-l-2 border-brass pl-3 text-sm text-ink-soft">
              {msg}
            </p>
          )}
          <button
            disabled={busy}
            className="w-full bg-ink py-3 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
          >
            {busy
              ? 'Please wait…'
              : mode === 'in'
                ? 'Sign in'
                : mode === 'up'
                  ? 'Create account'
                  : 'Send reset link'}
          </button>
        </form>
        <div className="mt-6 flex justify-between border-t border-rule pt-4 text-sm text-ink-soft">
          {mode === 'in' ? (
            <>
              <button onClick={() => setMode('up')} className="hover:text-ink">
                Create an account
              </button>
              <button
                onClick={() => setMode('forgot')}
                className="hover:text-ink"
              >
                Forgot password?
              </button>
            </>
          ) : (
            <button onClick={() => setMode('in')} className="hover:text-ink">
              Back to sign in
            </button>
          )}
        </div>
        <p className="mt-10 text-xs leading-relaxed text-meta">
          New accounts have no editorial access until an administrator assigns a
          role.
        </p>
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-ink-soft">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-meta">{hint}</span>}
    </label>
  )
}
