import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex w-full min-h-[88px] rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 focus:border-transparent disabled:opacity-50 transition-shadow resize-none',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
