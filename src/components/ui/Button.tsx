import { clsx } from 'clsx'

type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  className?: string
}

export default function Button({
  children, variant = 'primary', size = 'md',
  fullWidth = false, loading = false, disabled = false,
  type = 'button', onClick, className,
}: ButtonProps) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white',
        className,
        variant === 'primary' && 'rounded-full bg-user-teal text-white hover:bg-user-accent shadow-sm hover:shadow-md',
        variant === 'secondary' && 'rounded-full bg-user-accent text-white hover:bg-user-teal shadow-sm hover:shadow-md',
        variant === 'outline' && 'rounded-full border-2 border-user-teal text-user-teal bg-transparent hover:bg-user-teal hover:text-white',
        variant === 'danger' && 'rounded-lg bg-[#EF4444] text-white hover:bg-[#dc3737] focus:ring-[#EF4444]',
        variant === 'ghost' && 'rounded-lg text-user-muted hover:bg-user-surface hover:text-user-text',
        size === 'sm' && 'text-xs px-4 py-2',
        size === 'md' && 'text-sm px-5 py-2.5',
        size === 'lg' && 'text-base px-7 py-3',
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  )
}