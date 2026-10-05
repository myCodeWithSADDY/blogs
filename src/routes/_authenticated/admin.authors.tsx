import { createFileRoute } from '@tanstack/react-router'
import { CrudTable } from '@/components/admin/CrudTable'

export const Route = createFileRoute('/_authenticated/admin/authors')({
  component: () => (
    <CrudTable
      table="authors"
      title="Authors"
      kicker="Bylines"
      fields={[
        { key: 'name', label: 'Name', list: true, required: true },
        { key: 'email', label: 'Email', list: true },
        { key: 'avatar_url', label: 'Portrait image link' },
        { key: 'bio', label: 'Biography', type: 'textarea' },
      ]}
    />
  ),
})
