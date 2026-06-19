import { clsx } from 'clsx'

type CardProps = {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export default function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={clsx(
      'bg-white rounded-xl border border-gray-200 shadow-sm',
      padding === 'sm' && 'p-4',
      padding === 'md' && 'p-6',
      padding === 'lg' && 'p-8',
      className
    )}>
      {children}
    </div>
  )
}