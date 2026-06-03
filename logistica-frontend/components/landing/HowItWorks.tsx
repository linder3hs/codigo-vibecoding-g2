"use client"

import { m, useReducedMotion } from "framer-motion"
import { Plug, BrainCircuit, Radio, FileBarChart } from "lucide-react"

const STEPS = [
  {
    number: "01",
    icon: <Plug size={24} />,
    title: "Conecta tu flota",
    description: "Integra tus vehículos con GPS en minutos. Compatible con más de 200 dispositivos de tracking. Sin hardware adicional.",
    side: "left",
  },
  {
    number: "02",
    icon: <BrainCircuit size={24} />,
    title: "Configura rutas con IA",
    description: "Nuestro algoritmo analiza tráfico, ventanas de entrega y capacidad de carga para generar rutas óptimas automáticamente.",
    side: "right",
  },
  {
    number: "03",
    icon: <Radio size={24} />,
    title: "Monitorea en tiempo real",
    description: "Sigue cada envío desde el mapa central. Recibe alertas proactivas antes de que los problemas afecten al cliente.",
    side: "left",
  },
  {
    number: "04",
    icon: <FileBarChart size={24} />,
    title: "Recibe reportes automáticos",
    description: "KPIs de desempeño, costos por ruta y SLA de entrega directo a tu correo o exportados a tu ERP cada día.",
    side: "right",
  },
]

export function HowItWorks() {
  const reduced = useReducedMotion()

  return (
    <section id="how-it-works" className="py-24 bg-ds-section-alt">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-12">
        <m.div
          className="text-center mb-20"
          initial={reduced ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-sm font-heading font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full text-ds-primary bg-ds-primary/8">
            Cómo funciona
          </span>
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-ds-text" style={{ letterSpacing: "-0.02em" }}>
            Listo en 4 pasos
          </h2>
        </m.div>

        <div className="relative flex flex-col gap-16">
          {/* Timeline line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px hidden lg:block pointer-events-none bg-gradient-to-b from-transparent via-ds-primary/20 to-transparent" />

          {STEPS.map((step) => {
            const isLeft = step.side === "left"
            return (
              <m.div
                key={step.number}
                className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center"
                initial={reduced ? false : { opacity: 0, x: isLeft ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.65 }}
              >
                {/* Content */}
                <div className={isLeft ? "lg:order-1" : "lg:order-2"}>
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center bg-ds-primary/10 text-ds-primary">
                      {step.icon}
                    </div>
                    <div>
                      <span className="text-xs font-heading font-bold tracking-widest block mb-2 text-ds-cta">
                        PASO {step.number}
                      </span>
                      <h3 className="text-2xl font-heading font-bold mb-3 text-ds-text">{step.title}</h3>
                      <p className="text-base leading-relaxed text-ds-text/65 font-body">{step.description}</p>
                    </div>
                  </div>
                </div>

                {/* Visual */}
                <div className={isLeft ? "lg:order-2" : "lg:order-1"}>
                  <div className="rounded-3xl flex items-center justify-center bg-ds-primary/5 border border-ds-primary/10" style={{ height: 180 }}>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-ds-primary/12 text-ds-primary">
                        {step.icon}
                      </div>
                      <span className="text-6xl font-heading font-bold text-ds-primary/8 leading-none">{step.number}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline dot */}
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 hidden lg:block bg-ds-primary border-ds-section-alt ring-4 ring-ds-primary/15" style={{ top: "50%", transform: "translate(-50%, -50%)" }} />
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
