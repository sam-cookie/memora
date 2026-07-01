import { motion } from 'framer-motion'
import memoraLogo from '@/assets/memora.png'

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-5"
      >
        <img src={memoraLogo} alt="Memora" className="h-12 w-12" />
        <div className="flex gap-1.5" role="status" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/60"
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-12 ${className ?? ''}`}>
      <div className="flex gap-1.5" role="status" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/60"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </div>
    </div>
  )
}
