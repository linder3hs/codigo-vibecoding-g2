"use client"

const LOGOS = [
  "FedEx Latam", "DHL Express", "Walmart México", "Falabella",
  "Rappi", "MercadoLibre", "FEMSA", "Bimbo",
  "Liverpool", "Coppel", "Linio", "GrupoABC",
]

export function LogosBar() {
  const doubled = [...LOGOS, ...LOGOS]

  return (
    <section className="py-10 overflow-hidden bg-ds-logos border-t border-ds-primary/8 border-b border-ds-primary/8">
      <div className="max-w-screen-xl mx-auto px-6 mb-6">
        <p className="text-center text-sm font-medium font-body text-ds-text/50">
          Empresas líderes en Latinoamérica confían en LogisticaWeb
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-ds-logos to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-ds-logos to-transparent" />

        <div className="flex" style={{ animation: "marquee 28s linear infinite" }}>
          {doubled.map((name, i) => (
            <div key={i} className="flex-shrink-0 flex items-center justify-center px-10" style={{ minWidth: 160 }}>
              <span
                className="text-base font-heading font-semibold tracking-tight whitespace-nowrap text-ds-text/30 hover:text-ds-text/65 transition-colors duration-200 cursor-default"
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
