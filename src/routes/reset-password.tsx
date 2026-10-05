import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/reset-password')({
  head: () => ({
    meta: [
      { title: 'Set a new password — MunafaEstate' },
      {
        name: 'description',
        content:
          'Choose a new password for your MunafaEstate editorial account.',
      },
      { property: 'og:title', content: 'Set a new password — MunafaEstate' },
      {
        property: 'og:description',
        content: 'Choose a new password for your editorial account.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: Reset,
})

function Reset() {
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null)
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) return setErr(error.message)
    navigate({ to: '/admin' })
  }
  return (
    <div className="min-h-screen bg-paper">
      <form
        onSubmit={submit}
        className="mx-auto max-w-[420px] space-y-5 px-6 pt-24"
      >
        <h1 className="font-display text-4xl text-ink">Set a new password</h1>
        <input
          type="password"
          minLength={8}
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="admin-input"
          placeholder="New password"
        />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button className="w-full bg-ink py-3 text-sm font-medium text-paper">
          Save password
        </button>
      </form>
    </div>
  )
}
