"use client"

import { useRef } from "react"
import { m, useMotionValue, useSpring, useReducedMotion } from "framer-motion"
import { Star } from "lucide-react"

const TESTIMONIALS = [
  {
    name: "Alejandro Reyes",
    role: "Director de Operaciones",
    company: "Distribuidora ProFast",
    country: "México",
    text: "Reducimos el costo de combustible en un 24% el primer trimestre. La IA de rutas es increíblemente precisa y el onboarding fue muy rápido.",
    stars: 5,
    avatar: "AR",
    bgClass: "bg-ds-primary",
  },
  {
    name: "Valentina Torres",
    role: "Gerente de Supply Chain",
    company: "FreshDelivery LATAM",
    country: "Colombia",
    text: "El tracking en tiempo real cambió completamente nuestra relación con los clientes. Cero llamadas de '¿dónde está mi pedido?'.",
    stars: 5,
    avatar: "VT",
    bgClass: "bg-ds-cta",
  },
  {
    name: "Ricardo Mendoza",
    role: "VP de Logística",
    company: "MegaRetail",
    country: "Argentina",
    text: "La integración con SAP fue el diferenciador. En dos semanas teníamos todo sincronizado sin necesidad de desarrollo personalizado.",
    stars: 5,
    avatar: "RM",
    bgClass: "bg-ds-success",
  },
  {
    name: "Sandra Guzmán",
    role: "Jefe de Flota",
    company: "TransCargo Norte",
    country: "Chile",
    text: "Los conductores adoptaron la app en un día. La firma digital nos ahorró una cantidad brutal de papel y tiempo en disputas.",
    stars: 5,
    avatar: "SG",
    bgClass: "bg-ds-purple",
  },
  {
    name: "Jorge Castillo",
    role: "CEO",
    company: "LastMile Express",
    country: "Perú",
    text: "Pasamos de gestionar 50 vehículos con hojas de cálculo a 300 con LogisticaWeb. El salto de eficiencia fue inmediato.",
    stars: 5,
    avatar: "JC",
    bgClass: "bg-ds-primary",
  },
  {
    name: "María José Pérez",
    role: "Coordinadora Logística",
    company: "EcoPack Distribución",
    country: "Brasil",
    text: "El soporte es excepcional. Tienen SLA real y un equipo que entiende las particularidades del mercado latinoamericano.",
    stars: 5,
    avatar: "MP",
    bgClass: "bg-ds-cta",
  },
]

function TiltCard({ testimonial }: { testimonial: typeof TESTIMONIALS[0] }) {
  const reduced = useReducedMotion()
  const cardRef = useRef<HTMLDivElement>(null)
  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const springRotX = useSpring(rotX, { stiffness: 150, damping: 20 })
  const springRotY = useSpring(rotY, { stiffness: 150, damping: 20 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    rotX.set(((e.clientY - rect.top - rect.height / 2) / rect.height) * -8)
    rotY.set(((e.clientX - rect.left - rect.width / 2) / rect.width) * 8)
  }
  const onLeave = () => { rotX.set(0); rotY.set(0) }

  return (
    <m.div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={reduced ? undefined : {
        rotateX: springRotX,
        rotateY: springRotY,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
      }}
      className="rounded-3xl mb-5 cursor-default will-change-transform"
      whileHover={reduced ? undefined : { scale: 1.01 }}
      transition={{ scale: { duration: 0.2 } }}
    >
      <div className="rounded-3xl p-6 bg-white/75 border border-ds-primary/10 backdrop-blur-md" style={{ boxShadow: "0 4px 24px rgb(37 99 235 / 0.07)" }}>
        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: testimonial.stars }).map((_, i) => (
            <Star key={i} size={14} className="fill-ds-cta text-ds-cta" />
          ))}
        </div>

        {/* Quote */}
        <p className="text-sm leading-relaxed mb-5 text-ds-text/75 font-body">
          &ldquo;{testimonial.text}&rdquo;
        </p>

        {/* Author */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${testimonial.bgClass}`}>
            {testimonial.avatar}
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-ds-text">{testimonial.name}</p>
            <p className="text-xs text-ds-text/50">{testimonial.role} · {testimonial.company}</p>
          </div>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-ds-primary/8 text-ds-primary">
            {testimonial.country}
          </span>
        </div>
      </div>
    </m.div>
  )
}

export function Testimonials() {
  const reduced = useReducedMotion()
  const col1 = TESTIMONIALS.filter((_, i) => i % 3 === 0)
  const col2 = TESTIMONIALS.filter((_, i) => i % 3 === 1)
  const col3 = TESTIMONIALS.filter((_, i) => i % 3 === 2)

  return (
    <section id="testimonials" className="py-24 bg-ds-bg">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <m.div
          className="text-center mb-16"
          initial={reduced ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-sm font-heading font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full text-ds-primary bg-ds-primary/8">
            Testimonios
          </span>
          <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-4 text-ds-text" style={{ letterSpacing: "-0.02em" }}>
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-base text-ds-text/60 font-body">
            500+ empresas en 12 países ya operan con LogisticaWeb
          </p>
        </m.div>

        <m.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial={reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div>{col1.map((t) => <TiltCard key={t.name} testimonial={t} />)}</div>
          <div className="md:mt-8">{col2.map((t) => <TiltCard key={t.name} testimonial={t} />)}</div>
          <div className="hidden lg:block md:mt-4">{col3.map((t) => <TiltCard key={t.name} testimonial={t} />)}</div>
        </m.div>
      </div>
    </section>
  )
}
