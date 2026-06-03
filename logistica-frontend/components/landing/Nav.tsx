"use client"

import { useEffect, useState } from "react"
import { m, AnimatePresence } from "framer-motion"
import { Truck } from "lucide-react"

const NAV_LINKS = [
  { label: "Características", href: "#features" },
  { label: "Cómo funciona", href: "#how-it-works" },
  { label: "Clientes", href: "#testimonials" },
  { label: "Contacto", href: "#cta" },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div
        className={[
          "flex items-center justify-between px-6 lg:px-12 py-4 transition-all duration-300",
          scrolled
            ? "bg-ds-hero/85 backdrop-blur-xl border-b border-white/8 shadow-ds-glass"
            : "bg-ds-hero/40 border-b border-transparent",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-ds-cta">
            <Truck size={16} color="white" />
          </div>
          <span className="font-heading font-bold text-white text-lg tracking-tight">
            LogisticaWeb
          </span>
        </div>

        {/* Links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA — desktop */}
        <button className="hidden md:block px-5 py-2 text-sm font-semibold rounded-lg cursor-pointer bg-ds-cta text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-px">
          Solicitar demo
        </button>

        {/* Hamburger — mobile */}
        <button
          className="md:hidden text-white cursor-pointer p-1 hover:opacity-70 transition-opacity duration-200"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menú"
        >
          <div className="w-5 h-0.5 bg-white mb-1.5 transition-all duration-200 origin-center"
            style={{ transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
          <div className="w-5 h-0.5 bg-white mb-1.5 transition-all duration-200"
            style={{ opacity: menuOpen ? 0 : 1 }} />
          <div className="w-5 h-0.5 bg-white transition-all duration-200 origin-center"
            style={{ transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden px-4 pb-4 flex flex-col gap-1 bg-ds-hero/95 backdrop-blur-xl border-b border-white/8"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-3 rounded-xl text-sm font-medium text-white/75 hover:text-white cursor-pointer transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <button className="mt-2 px-5 py-3 text-sm font-semibold rounded-xl cursor-pointer bg-ds-cta text-white">
              Solicitar demo
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
