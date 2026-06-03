import { create } from "zustand"
import { getUserFromToken, clearTokens } from "@/lib/auth"
import type { JwtPayload } from "@/lib/auth"

interface AuthStore {
  user: JwtPayload | null
  hydrate: () => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  hydrate: () => set({ user: getUserFromToken() }),
  clear: () => {
    clearTokens()
    set({ user: null })
  },
}))
