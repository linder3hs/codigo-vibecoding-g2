"use client"

import { useState } from "react"
import { Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductThumbProps {
  src: string | null
  alt: string
  className?: string
}

// Muestra image_url del producto con fallback a un icono.
// image_url es una URL firmada temporal (~30 min): si caduca (403) el onError
// cae al fallback. No persistir esta URL; viene fresca en cada GET del producto.
export function ProductThumb({ src, alt, className }: ProductThumbProps) {
  // Guardamos la URL que falló: al llegar una `src` nueva, `failed` se recalcula
  // a false sin necesidad de useEffect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = !!src && failedSrc === src

  const base = "rounded-md object-cover bg-muted shrink-0"

  if (!src || failed) {
    return (
      <div className={cn(base, "flex items-center justify-center text-muted-foreground", className)}>
        <Package className="h-1/2 w-1/2" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL firmada externa y temporal, no optimizable por next/image
    <img
      src={src}
      alt={alt}
      className={cn(base, className)}
      onError={() => setFailedSrc(src)}
    />
  )
}
