import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn('field', className)} {...props} />,
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('field h-auto min-h-[88px] resize-y py-2.5', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn('field appearance-none pr-8', className)} {...props}>
      {children}
    </select>
  ),
)
Select.displayName = 'Select'

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('mb-1.5 block text-xs font-medium text-muted', className)} {...props}>
      {children}
    </label>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-2xs leading-relaxed text-faint">{hint}</p> : null}
      {error ? (
        <p className="mt-1.5 text-2xs text-critical" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function FormAlert({
  tone = 'critical',
  children,
}: {
  tone?: 'critical' | 'accent' | 'warn'
  children: React.ReactNode
}) {
  const toneClass =
    tone === 'accent'
      ? 'border-accent/30 bg-accent-soft text-accent'
      : tone === 'warn'
        ? 'border-warn/30 bg-warn/10 text-warn'
        : 'border-critical/30 bg-critical/10 text-critical'
  return (
    <div className={cn('rounded-sm border px-3 py-2 text-xs leading-relaxed', toneClass)} role="alert">
      {children}
    </div>
  )
}
