import { createFileRoute } from '@tanstack/react-router'
import { CrudTable } from '@/components/admin/CrudTable'

export const Route = createFileRoute('/_authenticated/admin/areas')({
  component: () => (
    <CrudTable
      table="areas"
      title="Areas"
      kicker="Locations"
      fields={[
        { key: 'name', label: 'Name', list: true, required: true },
        { key: 'city', label: 'City', list: true, required: true },
        { key: 'province', label: 'Province', list: true, required: true },
        { key: 'featured', label: 'Featured', type: 'checkbox', list: true },
        { key: 'hero_image_url', label: 'Cover image link' },
        { key: 'overview', label: 'Overview', type: 'textarea' },
        { key: 'market_summary', label: 'Market summary', type: 'textarea' },
        {
          key: 'development_information',
          label: 'Development information',
          type: 'textarea',
        },
      ]}
    />
  ),
})
