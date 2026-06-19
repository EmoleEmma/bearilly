import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

export default function AdminOverviewPage() {
  return (
    <div>
      <PageHeader title="Admin Overview" subtitle="Platform management dashboard." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['Total Users', 'Active Codes', 'Assessments', 'Submissions'].map((label) => (
          <Card key={label} padding="sm">
            <p className="text-xs text-muted font-medium">{label}</p>
            <p className="text-2xl font-bold text-primary mt-1">—</p>
          </Card>
        ))}
      </div>
    </div>
  )
}