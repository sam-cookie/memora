import { Link } from 'react-router-dom'
import memoraLogo from '@/assets/memora.png'
import { ROUTES } from '@/config/routes'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy policy', href: '#' },
    { label: 'Terms of service', href: '#' },
    { label: 'Security', href: '#' },
    { label: 'Cookie policy', href: '#' },
  ],
}

function scrollTo(href: string) {
  if (!href.startsWith('#')) return
  const id = href.replace('#', '')
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        {/* Top row */}
        <div className="mb-12 grid grid-cols-2 gap-10 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <Link to={ROUTES.home} className="mb-3 flex items-center gap-2.5" aria-label="Memora home">
              <img src={memoraLogo} alt="" className="h-6 w-6" aria-hidden="true" />
              <span className="font-display text-[15px] font-semibold tracking-tight">Memora</span>
            </Link>
            <p className="mb-5 max-w-[220px] text-[13.5px] leading-relaxed text-muted-foreground">
              AI meeting intelligence that turns every conversation into structured, searchable knowledge.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                aria-label="GitHub"
              >
                GitHub
              </a>
              <span className="text-border" aria-hidden="true">·</span>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                aria-label="Twitter / X"
              >
                Twitter
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="mb-4 text-[12px] font-semibold text-foreground">{category}</p>
              <ul className="space-y-2.5" role="list">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('#') ? (
                      <button
                        onClick={() => scrollTo(link.href)}
                        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a
                        href={link.href}
                        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-border/40 pt-8 sm:flex-row sm:items-center">
          <p className="text-[12px] text-muted-foreground/50">
            &copy; {year} Memora. All rights reserved.
          </p>
          <p className="text-[12px] text-muted-foreground/40">
            Built with care for teams who run on meetings.
          </p>
        </div>
      </div>
    </footer>
  )
}
