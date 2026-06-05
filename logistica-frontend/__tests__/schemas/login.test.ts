import { describe, expect, it } from "vitest";
import { z } from "zod";

// Replicado del schema definido en app/(auth)/login/page.tsx.
// Este test valida que el schema del spec se comporta como se documenta.
const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

describe("loginSchema", () => {
  describe("campos válidos", () => {
    it("pasa con username y password no vacíos", () => {
      const result = loginSchema.safeParse({
        username: "admin",
        password: "secret123",
      });
      expect(result.success).toBe(true);
    });

    it("pasa con un solo carácter en cada campo", () => {
      const result = loginSchema.safeParse({ username: "a", password: "b" });
      expect(result.success).toBe(true);
    });
  });

  describe("username vacío", () => {
    it("falla con string vacío", () => {
      const result = loginSchema.safeParse({ username: "", password: "valid" });
      expect(result.success).toBe(false);
    });

    it("muestra el mensaje 'El usuario es requerido'", () => {
      const result = loginSchema.safeParse({ username: "", password: "valid" });
      if (result.success) throw new Error("debería fallar");
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("El usuario es requerido");
    });

    it("falla cuando username está ausente", () => {
      const result = loginSchema.safeParse({ password: "valid" });
      expect(result.success).toBe(false);
    });
  });

  describe("password vacío", () => {
    it("falla con string vacío", () => {
      const result = loginSchema.safeParse({ username: "admin", password: "" });
      expect(result.success).toBe(false);
    });

    it("muestra el mensaje 'La contraseña es requerida'", () => {
      const result = loginSchema.safeParse({ username: "admin", password: "" });
      if (result.success) throw new Error("debería fallar");
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("La contraseña es requerida");
    });

    it("falla cuando password está ausente", () => {
      const result = loginSchema.safeParse({ username: "admin" });
      expect(result.success).toBe(false);
    });
  });

  describe("ambos campos vacíos", () => {
    it("falla y reporta ambos mensajes de error", () => {
      const result = loginSchema.safeParse({ username: "", password: "" });
      expect(result.success).toBe(false);
      if (result.success) return;
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("El usuario es requerido");
      expect(messages).toContain("La contraseña es requerida");
    });
  });

  describe("tipos inválidos", () => {
    it("falla cuando username no es string", () => {
      const result = loginSchema.safeParse({ username: 123, password: "x" });
      expect(result.success).toBe(false);
    });
  });
});
