import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import memoraLogo from '@/assets/memora.png'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { ROUTES } from '@/config/routes'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

function scrollToSection(href: string) {
  const id = href.replace('#', '')
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border/60 bg-background/85 backdrop-blur-xl'
          : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        {/* Logo */}
        <Link to={ROUTES.home} className="flex items-center gap-2.5" aria-label="Memora home">
          <img src={memoraLogo} alt="" className="h-7 w-7" aria-hidden="true" />
          <span className="font-display text-[15px] font-semibold tracking-tight">Memora</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <button
                onClick={() => scrollToSection(link.href)}
                className="rounded-md px-3 py-1.5 text-[13.5px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to={ROUTES.login} className="hidden md:block">
            <Button variant="ghost" size="sm" className="text-[13.5px]">
              Log in
            </Button>
          </Link>
          <Link to={ROUTES.register}>
            <Button variant="brand" size="sm" className="text-[13.5px] font-semibold">
              Get started
            </Button>
          </Link>

          {/* Mobile hamburger */}
          <button
            className="ml-1 flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-b border-border/60 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="px-5 pb-4 pt-2">
              <ul className="flex flex-col gap-0.5" role="list">
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => {
                        scrollToSection(link.href)
                        setMobileOpen(false)
                      }}
                      className="w-full rounded-md px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-surface-1 hover:text-foreground"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-col gap-2 border-t border-border/40 pt-3">
                <Link to={ROUTES.login} onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link to={ROUTES.register} onClick={() => setMobileOpen(false)}>
                  <Button variant="brand" size="sm" className="w-full font-semibold">
                    Get started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
