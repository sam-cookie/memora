import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/config/routes'
import { PageLoader } from '@/components/common/PageLoader'
import { LandingNavbar } from '../components/LandingNavbar'
import { HeroSection } from '../components/HeroSection'
import { TrustedBySection } from '../components/TrustedBySection'
import { FeaturesSection } from '../components/FeaturesSection'
import { HowItWorksSection } from '../components/HowItWorksSection'
import { ShowcaseSection } from '../components/ShowcaseSection'
import { BenefitsSection } from '../components/BenefitsSection'
import { TestimonialsSection } from '../components/TestimonialsSection'
import { PricingSection } from '../components/PricingSection'
import { FAQSection } from '../components/FAQSection'
import { FinalCTASection } from '../components/FinalCTASection'
import { LandingFooter } from '../components/LandingFooter'

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageLoader />
  if (isAuthenticated) return <Navigate to={ROUTES.dashboard} replace />

  return (
    <>
      <LandingNavbar />
      <main>
        <HeroSection />
        <TrustedBySection />
        <FeaturesSection />
        <HowItWorksSection />
        <ShowcaseSection />
        <BenefitsSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </>
  )
}
