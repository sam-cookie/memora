import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UploadPhase } from '../hooks/useUploadMeeting'

interface Step {
  phase: UploadPhase
  label: string
  description: string
}

const STEPS: Step[] = [
  { phase: 'uploading', label: 'Uploading', description: 'Sending your file to storage' },
  { phase: 'transcribing', label: 'Transcribing', description: 'Converting speech to text' },
  { phase: 'analyzing', label: 'Analyzing', description: 'Extracting insights with AI' },
  { phase: 'saving', label: 'Saving', description: 'Storing results to your account' },
]

const PHASE_ORDER: UploadPhase[] = ['uploading', 'transcribing', 'analyzing', 'saving', 'success']

function phaseIndex(phase: UploadPhase): number {
  return PHASE_ORDER.indexOf(phase)
}

interface UploadProgressProps {
  phase: UploadPhase
  uploadProgress: number
}

export function UploadProgress({ phase, uploadProgress }: UploadProgressProps) {
  const currentIndex = phaseIndex(phase)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {STEPS.map((step) => {
          const stepIndex = phaseIndex(step.phase)
          const isComplete = currentIndex > stepIndex
          const isActive = currentIndex === stepIndex
          const isPending = currentIndex < stepIndex

          return (
            <div key={step.phase} className="flex items-start gap-4">
              {/* Icon */}
              <div
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isComplete && 'border-primary bg-primary text-primary-foreground',
                  isActive && 'border-primary bg-background',
                  isPending && 'border-border bg-background',
                )}
                aria-hidden="true"
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 pt-0.5">
                <p
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isComplete && 'text-foreground',
                    isActive && 'text-foreground',
                    isPending && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>

                {/* Upload sub-progress bar */}
                {isActive && step.phase === 'uploading' && (
                  <div className="mt-2 space-y-1">
                    <div
                      role="progressbar"
                      aria-valuenow={uploadProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Upload progress"
                      className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-right text-xs text-muted-foreground">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Please keep this window open until processing completes.
      </p>
    </div>
  )
}
