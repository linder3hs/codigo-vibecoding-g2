"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { isAxiosError } from "axios"
import {
  Shield, Hash, Clock, KeyRound, CheckCircle2, AlertTriangle,
  Mail, User, Pencil, CalendarDays, Users,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { useMe, useUpdateMe } from "@/lib/hooks/use-me"
import { getUserFromToken } from "@/lib/auth"
import type { ApiError } from "@/types/common"

const profileSchema = z.object({
  first_name: z.string().max(150).optional().or(z.literal("")),
  last_name: z.string().max(150).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
  current_password: z.string().optional().or(z.literal("")),
}).refine(
  (v) => !v.password || !!v.current_password,
  { message: "Ingresa tu contraseña actual para cambiarla.", path: ["current_password"] }
)

type ProfileFormValues = z.infer<typeof profileSchema>

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-ES", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function getTokenStatus(exp: number): "active" | "expiring" | "expired" {
  const now = Math.floor(Date.now() / 1000)
  const remaining = exp - now
  if (remaining <= 0) return "expired"
  if (remaining < 300) return "expiring"
  return "active"
}

export default function ProfilePage() {
  const { data: me, isPending } = useMe()
  const updateMe = useUpdateMe()
  const tokenUser = getUserFromToken()
  const tokenStatus = tokenUser ? getTokenStatus(tokenUser.exp) : null

  const initials = (me?.username ?? tokenUser?.username ?? "U").slice(0, 2).toUpperCase()
  const isSuperAdmin = tokenUser?.is_superuser ?? false

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      current_password: "",
    },
  })

  // Populate form when me data arrives
  useEffect(() => {
    if (me) {
      form.reset({
        first_name: me.first_name ?? "",
        last_name: me.last_name ?? "",
        email: me.email ?? "",
        password: "",
        current_password: "",
      })
    }
  }, [me, form])

  function onSubmit(values: ProfileFormValues) {
    const payload: Record<string, string> = {}
    if (values.first_name !== undefined) payload.first_name = values.first_name
    if (values.last_name !== undefined) payload.last_name = values.last_name
    if (values.email) payload.email = values.email
    if (values.password) {
      payload.password = values.password
      payload.current_password = values.current_password ?? ""
    }

    updateMe.mutate(payload, {
      onSuccess: () => {
        form.setValue("password", "")
        form.setValue("current_password", "")
      },
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 400) {
          const data = error.response.data as ApiError
          for (const key of Object.keys(data)) {
            const msg = data[key]
            form.setError(key as keyof ProfileFormValues, {
              message: Array.isArray(msg) ? msg[0] : (msg as string),
            })
          }
        }
      },
    })
  }

  if (isPending) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona tu información personal y seguridad.
        </p>
      </div>

      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex items-end gap-4 -mt-10">
            <Avatar className="h-20 w-20 ring-4 ring-background flex-shrink-0">
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold truncate">
                  {me?.first_name && me?.last_name
                    ? `${me.first_name} ${me.last_name}`
                    : (me?.username ?? tokenUser?.username ?? "Usuario")}
                </h2>
                <Badge variant={isSuperAdmin ? "default" : "secondary"} className="gap-1">
                  <Shield className="h-3 w-3" />
                  {isSuperAdmin ? "Superadmin" : "Usuario"}
                </Badge>
              </div>
              {me?.email && (
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {me.email}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session alerts */}
      {tokenStatus === "expiring" && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Tu sesión expira en menos de 5 minutos. Vuelve a iniciar sesión para continuar.
        </div>
      )}
      {tokenStatus === "expired" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Tu sesión ha expirado. Por favor inicia sesión de nuevo.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Edit form — left / wider */}
        <div className="lg:col-span-3 space-y-6">
          {/* Información personal */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Editar información
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido</FormLabel>
                          <FormControl>
                            <Input placeholder="García" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <p className="text-xs text-muted-foreground">
                    Deja los campos de contraseña vacíos si no deseas cambiarla.
                  </p>

                  <FormField
                    control={form.control}
                    name="current_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña actual</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end pt-1">
                    <Button type="submit" disabled={updateMe.isPending}>
                      {updateMe.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Guardando...
                        </span>
                      ) : (
                        "Guardar cambios"
                      )}
                    </Button>
                  </div>

                  {updateMe.isSuccess && (
                    <p className="text-sm text-green-600 text-center">
                      Información actualizada correctamente.
                    </p>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Info sidebar — right */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 text-sm">
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" />
                  ID
                </div>
                <span className="font-mono font-medium">{me?.id ?? tokenUser?.user_id}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  Usuario
                </div>
                <span className="font-medium">{me?.username ?? tokenUser?.username}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Registrado
                </div>
                <span>{me?.date_joined ? formatDate(me.date_joined) : "—"}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Sesión
                </div>
                {tokenStatus === "active" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Activa
                  </span>
                )}
                {tokenStatus === "expiring" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    Expirando
                  </span>
                )}
                {tokenStatus === "expired" && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    Expirada
                  </span>
                )}
              </div>

              {tokenUser && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Token expira
                    </div>
                    <span className="text-xs">
                      {new Date(tokenUser.exp * 1000).toLocaleTimeString("es-ES", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Groups / roles */}
          {me?.groups && me.groups.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Grupos
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {me.groups.map((g) => (
                  <Badge key={g.id} variant="outline">{g.name}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
