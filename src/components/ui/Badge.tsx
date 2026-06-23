import { clsx } from 'clsx'

type BadgeProps = {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'admin' | 'default'
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-200',
      variant === 'success' && 'bg-[#10B981]/10 text-[#0D9488] border border-[#10B981]/20',
      variant === 'warning' && 'bg-[#C89B5A]/10 text-[#C89B5A] border border-[#C89B5A]/25',
      variant === 'danger' && 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',
      variant === 'info' && 'bg-[#4F7C82]/10 text-[#4F7C82] border border-[#4F7C82]/20',
      variant === 'admin' && 'bg-[#1E293B]/10 text-[#1E293B] border border-[#1E293B]/15',
      variant === 'default' && 'bg-user-border/50 text-user-muted border border-user-border',
    )}>
      {children}
    </span>
  )
}