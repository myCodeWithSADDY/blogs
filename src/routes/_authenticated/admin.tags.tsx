import { createFileRoute } from '@tanstack/react-router'
import { CrudTable } from '@/components/admin/CrudTable'

export const Route = createFileRoute('/_authenticated/admin/tags')({
  component: () => (
    <CrudTable
      table="tags"
      title="Tags"
      kicker="Structure"
      fields={[{ key: 'name', label: 'Name', list: true, required: true }]}
    />
  ),
})
