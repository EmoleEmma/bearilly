import { clsx } from 'clsx'

type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
}

export default function Button({
  children, variant = 'primary', size = 'md',
  fullWidth = false, loading = false, disabled = false,
  type = 'button', onClick,
}: ButtonProps) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        variant === 'primary' && 'bg-[#1E3A5F] text-white hover:bg-[#2E75B6] focus:ring-[#1E3A5F]',
        variant === 'secondary' && 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'text-primary hover:bg-blue-50',
        size === 'sm' && 'text-sm px-3 py-1.5',
        size === 'md' && 'text-sm px-4 py-2.5',
        size === 'lg' && 'text-base px-6 py-3',
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