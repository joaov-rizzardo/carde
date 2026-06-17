'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'group flex h-11 w-11 flex-shrink-0 items-center justify-center focus:outline-none disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="relative inline-flex h-6 w-10 items-center rounded-full bg-brand-border transition-colors group-data-[state=checked]:bg-status-success group-focus-visible:ring-2 group-focus-visible:ring-brand-accent group-focus-visible:ring-offset-1">
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
    </span>
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
