import { clsx } from 'clsx'

type InputProps = {
  label: string
  name: string
  type?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

export default function Input({
  label, name, type = 'text', placeholder, error,
  required, disabled, value, onChange, className,
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-semibold text-user-text uppercase tracking-wider">
        {label} {required && <span className="text-[#EF4444]">*</span>}
      </label>
      <input
        id={name} name={name} type={type} placeholder={placeholder}
        required={required} disabled={disabled} value={value} onChange={onChange}
        className={clsx(
          'w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-user-accent',
          error
            ? 'border-[#EF4444]/40 bg-[#EF4444]/5 text-[#7f1d1d] placeholder-[#EF4444]/40'
            : 'border-user-border bg-user-surface text-user-text placeholder-user-muted/50 hover:border-user-accent/50 focus:bg-white',
          disabled && 'opacity-50 cursor-not-allowed bg-user-border/30',
          className
        )}
      />
      {error && <p className="text-xs font-medium text-[#EF4444]">{error}</p>}
    </div>
  )
}