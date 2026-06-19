import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function AssessmentsPage() {
  return (
    <div>
      <PageHeader
        title="Assessment Center"
        subtitle="Complete tasks and submit your projects."
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {['Available', 'Active', 'Completed'].map((tab) => (
          <button
            key={tab}
            className="px-4 py-2 text-sm rounded-md font-medium text-gray-600 hover:bg-white transition-all first:bg-white first:text-gray-900 first:shadow-sm"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-1/2" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
              <Badge variant="info">Available</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}