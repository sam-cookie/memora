import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="print:hidden">
        <Sidebar
          open={isMobile ? sidebarOpen : true}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
      </div>

      {/* Main content */}
      <div className={cn('flex flex-1 flex-col overflow-hidden', !isMobile && 'print:ml-0 ml-64')}>
        <div className="print:hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>

        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
