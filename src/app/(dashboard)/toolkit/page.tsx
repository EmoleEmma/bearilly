import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'

const toolCategories = ['Video Tools', 'Design Tools', 'Audio Tools', 'Writing Tools', 'Productivity']

export default function ToolkitPage() {
  return (
    <div>
      <PageHeader
        title="Creator Toolkit"
        subtitle="Free tools to help you create better content."
      />
      <div className="flex gap-2 flex-wrap mb-6">
        {['All', ...toolCategories].map((cat) => (
          <button
            key={cat}
            className="px-4 py-1.5 text-sm rounded-full border border-border bg-white hover:bg-primary-50 hover:border-primary text-gray-700 transition-all"
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <div className="h-4 bg-gray-100 rounded animate-pulse mb-2 w-3/4" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
          </Card>
        ))}
      </div>
    </div>
  )
}