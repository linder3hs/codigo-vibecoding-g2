"use client"

import { m, useReducedMotion } from "framer-motion"
import { MapPin, BarChart3, Route, Zap, Smartphone, ArrowRight } from "lucide-react"

const FEATURES = [
  {
    icon: <MapPin size={22} />,
    title: "Tracking en tiempo real",
    description: "Visualiza toda tu flota en un mapa interactivo. Recibe alertas instantáneas sobre desvíos, retrasos y entregas confirmadas.",
    featured: true,
    colorClass: "text-ds-primary",
    bgClass: "bg-ds-primary/12",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Dashboard de operaciones",
    description: "KPIs, alertas y reportes automáticos en un solo panel. Toma decisiones basadas en datos en tiempo real.",
    featured: false,
    colorClass: "text-ds-secondary",
    bgClass: "bg-ds-secondary/12",
  },
  {
    icon: <Route size={22} />,
    title: "Rutas optimizadas con IA",
    description: "Nuestro motor de IA reduce hasta un 28% el costo de combustible optimizando rutas dinámicamente.",
    featured: false,
    colorClass: "text-ds-cta",
    bgClass: "bg-ds-cta/12",
  },
  {
    icon: <Zap size={22} />,
    title: "Integración con ERP y SAP",
    description: "Conecta con tus sistemas existentes: SAP, Oracle, facturación electrónica y más de 40 integraciones nativas.",
    featured: false,
    colorClass: "text-ds-purple",
    bgClass: "bg-ds-purple/12",
  },
  {
    icon: <Smartphone size={22} />,
    title: "App móvil para conductores",
    description: "Firma digital, evidencia fotográfica y comunicación directa. Todo lo que tu equipo en campo necesita.",
    featured: false,
    colorClass: "text-ds-success",
    bgClass: "bg-ds-success/12",
  },
]

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const cardAnim = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export function Features() {
  const reduced = useReducedMotion()
  const [featured, ...rest] = FEATURES

  return (
    <section id="features" className="py-24 bg-ds-bg">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <m.div
          className="text-center mb-16"
          initial={reduced ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-sm font-heading font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full text-ds-primary bg-ds-primary/8">
            Características
          </span>
          <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-4 text-ds-text" style={{ letterSpacing: "-0.02em" }}>
            Todo lo que tu operación necesita
          </h2>
          <p className="text-lg max-w-xl mx-auto text-ds-text/65 font-body">
            Una plataforma unificada para gestionar cada parte de tu cadena logística.
          </p>
        </m.div>

        {/* Grid */}
        <m.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={stagger}
          initial={reduced ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Featured — 2 cols */}
          <m.div
            variants={reduced ? undefined : cardAnim}
            className="lg:col-span-2 rounded-3xl p-8 relative overflow-hidden group cursor-pointer bg-ds-primary/10 border border-ds-primary/20 will-change-transform"
            whileHover={reduced ? undefined : { y: -4 }}
            transition={{ duration: 0.25 }}
          >
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full pointer-events-none bg-ds-primary/12" />

            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-6 ${featured.bgClass} ${featured.colorClass}`}>
              {featured.icon}
            </div>

            <div className="inline-block mb-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-ds-primary/12 text-ds-primary">
              Característica principal
            </div>

            <h3 className="text-2xl font-heading font-bold mb-3 text-ds-text">{featured.title}</h3>
            <p className="text-base mb-6 max-w-md text-ds-text/70 font-body leading-relaxed">{featured.description}</p>

            {/* Mini map */}
            <div className="rounded-2xl overflow-hidden relative bg-ds-primary/6 border border-ds-primary/12" style={{ height: 120 }}>
              <svg viewBox="0 0 600 120" className="w-full h-full">
                {[30, 60, 90].map(y => <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgb(37 99 235 / 0.06)" strokeWidth="1" />)}
                {[100, 200, 300, 400, 500].map(x => <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="rgb(37 99 235 / 0.06)" strokeWidth="1" />)}
                <path d="M 60 90 C 150 60, 250 40, 350 50 S 490 25, 540 20" stroke="rgb(37 99 235 / 0.5)" strokeWidth="2" fill="none" strokeDasharray="5 3" />
                <circle cx="60" cy="90" r="5" fill="#F97316" />
                <circle cx="350" cy="50" r="4" fill="#2563EB" />
                <circle cx="540" cy="20" r="5" fill="#10B981" />
              </svg>
            </div>

            <div className="flex items-center gap-2 mt-5 text-sm font-semibold text-ds-primary cursor-pointer group-hover:gap-3 transition-all duration-200">
              Ver demo del mapa
              <ArrowRight size={16} />
            </div>
          </m.div>

          {/* Regular cards */}
          {rest.map((f) => (
            <m.div
              key={f.title}
              variants={reduced ? undefined : cardAnim}
              className="rounded-3xl p-7 relative group cursor-pointer bg-white/70 border border-ds-primary/10 backdrop-blur-md will-change-transform"
              whileHover={reduced ? undefined : { y: -4, borderColor: "rgb(37 99 235 / 0.25)" }}
              transition={{ duration: 0.25 }}
            >
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-5 ${f.bgClass} ${f.colorClass}`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-heading font-bold mb-2 text-ds-text">{f.title}</h3>
              <p className="text-sm leading-relaxed text-ds-text/65 font-body">{f.description}</p>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  )
}
