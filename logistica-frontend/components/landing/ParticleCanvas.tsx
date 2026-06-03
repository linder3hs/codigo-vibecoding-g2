"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -9999, y: -9999 })
  const raf = useRef<number>(0)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isMobile = window.innerWidth < 768

    const setSize = () => {
      canvas.width = window.innerWidth
      canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight
    }
    setSize()
    window.addEventListener("resize", setSize, { passive: true })

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    if (!isMobile) window.addEventListener("mousemove", onMove, { passive: true })

    // Fewer particles + no connections on mobile
    const N = isMobile ? 40 : 100
    const MAX_DIST = isMobile ? 0 : 130   // 0 = skip connections
    const MOUSE_DIST = 110

    const particles: Particle[] = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.5 + 0.5,
    }))

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const { x: mx, y: my } = mouse.current

      for (let i = 0; i < N; i++) {
        const p = particles[i]

        if (!isMobile) {
          const dx = p.x - mx
          const dy = p.y - my
          const d = Math.hypot(dx, dy)
          if (d < MOUSE_DIST && d > 0) {
            const f = ((MOUSE_DIST - d) / MOUSE_DIST) * 0.5
            p.vx += (dx / d) * f
            p.vy += (dy / d) * f
          }
          const spd = Math.hypot(p.vx, p.vy)
          if (spd > 1.5) { p.vx *= 1.5 / spd; p.vy *= 1.5 / spd }
        }

        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(147,197,253,0.8)"
        ctx.fill()

        if (MAX_DIST > 0) {
          for (let j = i + 1; j < N; j++) {
            const q = particles[j]
            const dist = Math.hypot(p.x - q.x, p.y - q.y)
            if (dist < MAX_DIST) {
              ctx.beginPath()
              ctx.moveTo(p.x, p.y)
              ctx.lineTo(q.x, q.y)
              ctx.strokeStyle = `rgba(147,197,253,${(1 - dist / MAX_DIST) * 0.22})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }
      }
      raf.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener("resize", setSize)
      if (!isMobile) window.removeEventListener("mousemove", onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-55" />
}
