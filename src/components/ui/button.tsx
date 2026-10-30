import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-accent text-[hsl(var(--accent-ink))] hover:brightness-105 shadow-[0_10px_30px_-12px_hsl(var(--accent)/0.8)]',
        primary: 'bg-accent text-[hsl(var(--accent-ink))] hover:brightness-105 shadow-[0_10px_30px_-12px_hsl(var(--accent)/0.8)]',
        secondary: 'bg-raised text-ink border border-line hover:border-accent/50 hover:bg-raised/70',
        outline: 'border border-line bg-transparent text-ink hover:border-accent/50 hover:bg-raised/60',
        ghost: 'text-muted hover:bg-raised hover:text-ink',
        destructive: 'bg-critical text-white hover:brightness-110',
        danger: 'bg-critical text-white hover:brightness-110',
        link: 'text-accent underline-offset-4 hover:underline',
        glass: 'border border-line/70 bg-surface/60 text-ink backdrop-blur-xl hover:border-accent/40 hover:bg-surface',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-5',
        default: 'h-11 px-5',
        lg: 'h-13 px-7 text-[0.95rem]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
