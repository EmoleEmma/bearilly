type Stat = {
  label: string
  value: string | number
}

export default function AdminStatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex flex-wrap gap-4 mb-6 px-1">
      {stats.map(s => (
        <div key={s.label} className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold" style={{ color: '#2DD4BF' }}>{s.value}</span>
          <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}
