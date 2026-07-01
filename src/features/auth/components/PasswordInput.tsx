import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { InputProps } from '@/components/ui/input'

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'endIcon'>>(
  ({ ...props }, ref) => {
    const [show, setShow] = useState(false)

    return (
      <Input
        {...props}
        ref={ref}
        type={show ? 'text' : 'password'}
        endIcon={
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
