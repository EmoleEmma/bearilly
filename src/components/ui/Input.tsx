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
}

export default function Input({
  label, name, type = 'text', placeholder, error,
  required, disabled, value, onChange,
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name} name={name} type={type} placeholder={placeholder}
        required={required} disabled={disabled} value={value} onChange={onChange}
        className={clsx(
          'w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          error ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-100'
        )}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}