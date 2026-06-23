import { clsx } from 'clsx'

type CardProps = {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export default function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div className={clsx(
      'bg-user-card rounded-xl shadow-md hover:shadow-lg transition-all duration-200 ease-in-out border border-user-border/60',
      padding === 'sm' && 'p-4',
      padding === 'md' && 'p-6',
      padding === 'lg' && 'p-8',
      className
    )}>
      {children}
    </div>
  )
}