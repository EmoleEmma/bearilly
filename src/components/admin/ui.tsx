// Small shared pieces for the dark admin theme. Uses only tokens that already
// exist in globals.css (@theme): admin-bg / surface / card / accent / border / text / muted.
import { clsx } from 'clsx'

export const adminInput =
  'w-full px-3 py-2.5 rounded-lg text-sm bg-admin-card border border-admin-border text-white ' +
  'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-admin-accent/50'

export const adminLabel =
  'block text-xs font-bold text-admin-muted uppercase tracking-wide mb-1.5'

export function AdminCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-xl p-5 bg-admin-surface border border-admin-border/40', className)}>
      {children}
    </div>
  )
}

export function AdminButton({
  children, onClick, disabled, variant = 'primary', type = 'button', className,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60',
        variant === 'primary' && 'bg-admin-accent text-white hover:bg-admin-accent2',
        variant === 'ghost' && 'border border-admin-border text-admin-muted hover:text-white hover:bg-admin-card',
        variant === 'danger' && 'border border-red-500/60 text-red-400 hover:bg-red-500/10',
        className
      )}
    >
      {children}
    </button>
  )
}

export function EmptyState({ title, note }: { title: string; note?: string }) {
  return (
    <div className="text-center py-14 rounded-xl bg-admin-surface border border-admin-border/40">
      <p className="text-sm font-bold text-admin-muted">{title}</p>
      {note && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{note}</p>}
    </div>
  )
}
