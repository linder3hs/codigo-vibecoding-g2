"use client"

import { useState } from "react"
import { m, useReducedMotion } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"

const PERKS = [
  "Demo personalizada de 30 minutos",
  "Sin contrato de permanencia",
  "Onboarding guiado incluido",
  "Soporte en español 24/7",
]

export function CTAFinal() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const reduced = useReducedMotion()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <section id="cta" className="py-24 relative overflow-hidden bg-ds-hero">
      {/* Background glow */}
      {!reduced && (
        <m.div
          className="absolute pointer-events-none rounded-full will-change-transform"
          style={{
            width: 600, height: 600,
            background: "radial-gradient(circle, rgb(37 99 235 / 0.15) 0%, transparent 70%)",
            top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            filter: "blur(40px)",
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="max-w-screen-xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Rotating gradient border panel */}
        <div className="relative max-w-3xl mx-auto rounded-[32px] overflow-hidden p-px">
          {/* Rotating gradient layer */}
          {!reduced && (
            <m.div
              className="absolute inset-0 will-change-transform"
              style={{
                background: "conic-gradient(from 0deg at 50% 50%, #2563EB, #3B82F6, #F97316, #3B82F6, #2563EB)",
                opacity: 0.6,
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          )}
          {/* Static fallback border for reduced motion */}
          {reduced && <div className="absolute inset-0 bg-gradient-to-r from-ds-primary to-ds-cta opacity-60" />}

          {/* Panel */}
          <div
            className="relative rounded-[30px] px-8 py-12 lg:px-16 lg:py-16 text-center bg-ds-hero/92 backdrop-blur-xl"
            style={{ boxShadow: "inset 0 0 80px rgb(37 99 235 / 0.08)" }}
          >
            <m.span
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block text-sm font-heading font-semibold tracking-widest uppercase mb-6 px-3 py-1 rounded-full text-ds-blue-light bg-ds-primary/15"
            >
              Empieza hoy gratis
            </m.span>

            <m.h2
              initial={reduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl lg:text-5xl font-heading font-bold text-white mb-4"
              style={{ letterSpacing: "-0.02em" }}
            >
              Solicita tu demo gratuita
            </m.h2>

            <m.p
              initial={reduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg mb-10 max-w-xl mx-auto text-white/55 font-body"
            >
              Un especialista en logística te mostrará la plataforma adaptada a los
              procesos específicos de tu empresa.
            </m.p>

            <m.div
              initial={reduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {submitted ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-ds-success/15">
                    <CheckCircle size={28} className="text-ds-success" />
                  </div>
                  <p className="text-white font-heading font-semibold text-lg">¡Solicitud enviada!</p>
                  <p className="text-sm text-white/50">Te contactaremos en menos de 24 horas hábiles.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    required
                    className="flex-1 px-5 py-3.5 rounded-xl text-sm font-medium outline-none text-white bg-white/6 border border-white/12 focus:border-ds-primary/60 transition-colors duration-200 placeholder:text-white/30"
                  />
                  <m.button
                    type="submit"
                    whileHover={reduced ? undefined : { scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white cursor-pointer flex-shrink-0 bg-ds-cta shadow-ds-cta"
                  >
                    Solicitar demo
                    <ArrowRight size={16} />
                  </m.button>
                </form>
              )}
            </m.div>

            <m.div
              initial={reduced ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8"
            >
              {PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-1.5 text-xs text-white/45">
                  <CheckCircle size={13} className="text-ds-success" />
                  {perk}
                </div>
              ))}
            </m.div>
          </div>
        </div>
      </div>
    </section>
  )
}
