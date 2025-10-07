"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn, signUp } from "@/lib/auth-client"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AuthPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/")
    }
  }, [isPending, session, router])

  const handleLogin = async () => {
    setLoading(true)
    try {
      const res = await signIn.email({ email, password })
      if (res.error) {
        toast.error(res.error.message || "Error al iniciar sesión")
      } else {
        toast.success("Sesión iniciada")
        router.replace("/")
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setLoading(true)
    try {
      const nameCandidate = (displayName || email.split("@")[0]).trim()
      const res = await signUp.email({ email, password, name: nameCandidate })
      if (res.error) {
        toast.error(res.error.message || "Error en el registro")
      } else {
        toast.success("Registro exitoso. Ahora inicia sesión")
        setMode("login")
      }
    } catch (e: any) {
      toast.error(e?.message || "Error en el registro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === "login" ? "Inicia sesión" : "Regístrate"}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Accede con tu correo y contraseña"
              : "Crea tu cuenta con correo y contraseña"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "register" && (
              <Input
                type="text"
                placeholder="¿Cómo quieres que te mencionemos?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}
          </div>

          {mode === "login" ? (
            <Button className="w-full" onClick={handleLogin} disabled={loading || isPending}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleRegister} disabled={loading || isPending}>
              {loading ? "Registrando..." : "Registrarme"}
            </Button>
          )}

          <div className="text-sm text-center">
            {mode === "login" ? (
              <button
                className="underline"
                onClick={() => setMode("register")}
                disabled={loading}
              >
                ¿No tienes cuenta? Regístrate
              </button>
            ) : (
              <button
                className="underline"
                onClick={() => setMode("login")}
                disabled={loading}
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}