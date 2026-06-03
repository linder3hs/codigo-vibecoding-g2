import { LandingWrapper } from "@/components/landing/LandingWrapper"
import { Nav } from "@/components/landing/Nav"
import { Hero } from "@/components/landing/Hero"
import { LogosBar } from "@/components/landing/LogosBar"
import { Features } from "@/components/landing/Features"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Testimonials } from "@/components/landing/Testimonials"
import { CTAFinal } from "@/components/landing/CTAFinal"
import { Footer } from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <LandingWrapper>
      <div className="font-body">
        <Nav />
        <Hero />
        <LogosBar />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTAFinal />
        <Footer />
      </div>
    </LandingWrapper>
  )
}
