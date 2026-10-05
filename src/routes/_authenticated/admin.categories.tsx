import { createFileRoute } from '@tanstack/react-router'
import { CrudTable } from '@/components/admin/CrudTable'

export const Route = createFileRoute('/_authenticated/admin/categories')({
  component: () => (
    <CrudTable
      table="categories"
      title="Sections"
      kicker="Structure"
      order="display_order"
      fields={[
        { key: 'name', label: 'Name', list: true, required: true },
        { key: 'display_order', label: 'Order', type: 'number', list: true },
        { key: 'featured', label: 'Featured', type: 'checkbox', list: true },
        { key: 'description', label: 'Introduction', type: 'textarea' },
      ]}
    />
  ),
})
