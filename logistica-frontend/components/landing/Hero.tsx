"use client"

import { useRef } from "react"
import { m, useMotionValue, useSpring, useReducedMotion } from "framer-motion"
import { ArrowRight, MapPin, BarChart3, Route, CheckCircle } from "lucide-react"
import { ParticleCanvas } from "./ParticleCanvas"

const HEADLINE_WORDS = ["Mueve", "más,", "gestiona", "menos."]

const BADGES = [
  { icon: <MapPin size={14} className="text-ds-cta" />, label: "Tracking en vivo", top: "18%", left: "72%", delay: 0 },
  { icon: <BarChart3 size={14} className="text-ds-primary" />, label: "Dashboard KPIs", top: "52%", left: "78%", delay: 0.6 },
  { icon: <Route size={14} className="text-ds-success" />, label: "Rutas con IA", top: "76%", left: "68%", delay: 1.2 },
]

const SOCIAL_PROOF = [
  { value: "500+", label: "empresas activas" },
  { value: "98%", label: "uptime garantizado" },
  { value: "3.2M+", label: "envíos procesados" },
]

function MagneticButton({
  children,
  primary = false,
}: {
  children: React.ReactNode
  primary?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 20 })
  const springY = useSpring(y, { stiffness: 200, damping: 20 })

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * 0.25)
    y.set((e.clientY - rect.top - rect.height / 2) * 0.25)
  }
  const onLeave = () => { x.set(0); y.set(0) }

  return (
    <m.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={reduced ? undefined : { scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={[
        "flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base cursor-pointer will-change-transform",
        primary
          ? "bg-ds-cta text-white shadow-ds-cta"
          : "bg-white/6 text-white border border-white/15 backdrop-blur-md",
      ].join(" ")}
    >
      {children}
    </m.button>
  )
}

export function Hero() {
  const reduced = useReducedMotion()

  const wordAnim = (i: number) =>
    reduced
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 60, filter: "blur(8px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.6, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
        }

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-ds-hero"
      style={{ minHeight: "100dvh" }}
    >
      {/* Animated mesh blobs — skip on reduced motion */}
      {!reduced && (
        <>
          <m.div
            className="absolute pointer-events-none will-change-transform"
            style={{
              width: 700, height: 700, borderRadius: "50%",
              background: "radial-gradient(circle, rgb(37 99 235 / 0.18) 0%, transparent 70%)",
              top: "-15%", left: "-10%", filter: "blur(40px)",
            }}
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.div
            className="absolute pointer-events-none will-change-transform"
            style={{
              width: 500, height: 500, borderRadius: "50%",
              background: "radial-gradient(circle, rgb(59 130 246 / 0.12) 0%, transparent 70%)",
              bottom: "5%", right: "-5%", filter: "blur(60px)",
            }}
            animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </>
      )}

      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.025) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise texture */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] mix-blend-overlay">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      <ParticleCanvas />

      {/* Content */}
      <div
        className="relative z-10 max-w-screen-xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16"
        style={{ minHeight: "100dvh", paddingTop: "calc(80px + var(--space-3xl))", paddingBottom: "var(--space-3xl)" }}
      >
        {/* Left */}
        <div className="flex-1 flex flex-col gap-8 max-w-2xl">
          {/* Badge */}
          <m.div
            {...(reduced ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } })}
            className="inline-flex self-start items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-ds-primary/15 border border-ds-primary/30 text-ds-blue-light"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ds-blue-light animate-pulse" />
            Plataforma logística #1 en Latam
          </m.div>

          {/* Headline */}
          <h1
            className="font-heading font-bold leading-tight text-white"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", letterSpacing: "-0.02em" }}
          >
            {HEADLINE_WORDS.map((word, i) => (
              <m.span
                key={i}
                className="inline-block mr-[0.25em] will-change-transform"
                {...wordAnim(i)}
              >
                {word}
              </m.span>
            ))}
          </h1>

          {/* Subheadline */}
          <m.p
            {...(reduced ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.9 } })}
            className="text-lg leading-relaxed text-white/65"
          >
            Logística inteligente para empresas que no se detienen. Tracking en tiempo real,
            rutas optimizadas con IA y gestión de flotas desde un solo panel de control.
          </m.p>

          {/* CTAs */}
          <m.div
            {...(reduced ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 1.1 } })}
            className="flex flex-wrap gap-4"
          >
            <MagneticButton primary>
              Solicitar demo gratuita
              <ArrowRight size={18} />
            </MagneticButton>
            <MagneticButton>
              Ver video del producto
            </MagneticButton>
          </m.div>

          {/* Social proof */}
          <m.div
            {...(reduced ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6, delay: 1.3 } })}
            className="flex items-center gap-8 pt-2 flex-wrap"
          >
            {SOCIAL_PROOF.map((item, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-2xl font-heading font-bold text-white">{item.value}</span>
                <span className="text-sm text-white/70">{item.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-sm text-white/70">
              <CheckCircle size={15} className="text-ds-success" />
              Sin tarjeta de crédito
            </div>
          </m.div>
        </div>

        {/* Right: glass dashboard card */}
        <div className="flex-1 relative hidden lg:flex justify-center items-center">
          <m.div
            {...(reduced
              ? {}
              : { initial: { opacity: 0, x: 40, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, transition: { duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
            )}
            className="relative w-full max-w-md rounded-3xl p-6 will-change-transform"
            style={{
              backdropFilter: "blur(24px)",
              background: "rgb(255 255 255 / 0.05)",
              border: "1px solid rgb(255 255 255 / 0.1)",
              boxShadow: "0 0 0 1px rgb(37 99 235 / 0.2), 0 40px 80px rgb(0 0 0 / 0.4), inset 0 0 60px rgb(37 99 235 / 0.06)",
            }}
          >
            {/* Inner glow */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgb(37 99 235 / 0.15) 0%, transparent 70%)" }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-medium text-white/40">Panel de operaciones</p>
                <p className="text-white font-semibold text-sm font-heading">Lunes, 2 Jun — En vivo</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-ds-success/15 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Activo
              </span>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Envíos hoy", value: "1,243", delta: "+12%" },
                { label: "En tránsito", value: "847", delta: "+5%" },
                { label: "Entregados", value: "396", delta: "99.2%" },
              ].map((kpi, i) => (
                <div key={i} className="rounded-xl p-3 bg-white/5">
                  <p className="text-[10px] mb-1 text-white/40">{kpi.label}</p>
                  <p className="text-white font-heading font-bold text-lg leading-none">{kpi.value}</p>
                  <p className="text-[10px] mt-1 text-emerald-300">{kpi.delta}</p>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden mb-4 relative bg-ds-primary/10 border border-ds-primary/12" style={{ height: 160 }}>
              <svg viewBox="0 0 360 160" className="w-full h-full opacity-70">
                {[40, 80, 120].map(y => <line key={y} x1="0" y1={y} x2="360" y2={y} stroke="rgb(255 255 255 / 0.04)" strokeWidth="1" />)}
                {[60, 120, 180, 240, 300].map(x => <line key={x} x1={x} y1="0" x2={x} y2="160" stroke="rgb(255 255 255 / 0.04)" strokeWidth="1" />)}
                <path d="M 40 120 C 100 80, 160 60, 220 70 S 300 40, 320 30" stroke="#2563EB" strokeWidth="2.5" fill="none" strokeDasharray="6 3" />
                <path d="M 40 120 C 100 80, 160 60, 220 70" stroke="#3B82F6" strokeWidth="2.5" fill="none" />
                <circle cx="40" cy="120" r="5" fill="#F97316" />
                <circle cx="220" cy="70" r="5" fill="#2563EB" />
                {!reduced && (
                  <m.circle cx="220" cy="70" r="10" fill="none" stroke="#2563EB" strokeWidth="1.5"
                    animate={{ r: [10, 18], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <circle cx="320" cy="30" r="5" fill="#10B981" />
              </svg>
              <div className="absolute bottom-3 left-3 text-[10px] font-medium text-white/50">
                Ruta CDMX → Guadalajara
              </div>
            </div>

            {/* Vehicles */}
            {[
              { id: "V-041", driver: "Carlos M.", pct: 68 },
              { id: "V-087", driver: "Laura G.", pct: 20 },
            ].map((v) => (
              <div key={v.id} className="flex items-center gap-3 py-2.5 border-t border-white/6">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white bg-ds-primary/30">
                  {v.id.split("-")[1]}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white font-medium">{v.driver}</span>
                    <span className="text-white/45">{v.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/8">
                    <m.div
                      className="h-full rounded-full"
                      style={{ background: v.pct > 50 ? "#2563EB" : "#F97316" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${v.pct}%` }}
                      transition={{ duration: 1.2, delay: 1 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </m.div>

          {/* Floating badges */}
          {!reduced && BADGES.map((badge, i) => (
            <m.div
              key={i}
              className="absolute flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white will-change-transform"
              style={{
                top: badge.top, left: badge.left,
                backdropFilter: "blur(16px)",
                background: "rgb(255 255 255 / 0.08)",
                border: "1px solid rgb(255 255 255 / 0.12)",
                boxShadow: "0 4px 16px rgb(0 0 0 / 0.3)",
                whiteSpace: "nowrap",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
              transition={{
                opacity: { duration: 0.4, delay: 1 + badge.delay },
                scale: { duration: 0.4, delay: 1 + badge.delay },
                y: { duration: 4, delay: badge.delay, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              {badge.icon}
              {badge.label}
            </m.div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      {!reduced && (
        <m.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs text-white/30">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </m.div>
      )}
    </section>
  )
}
