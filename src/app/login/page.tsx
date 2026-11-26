"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Activity } from "lucide-react"

export default function LoginPage() {
  const { setTheme } = useTheme()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    setTheme("light")
  }, [setTheme])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setCarregando(true)

    try {
      const result = await signIn("credentials", {
        email,
        senha,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes("bloquead") || result.error.includes("tentativas")) {
          setErro(result.error)
        } else {
          setErro("Email ou senha incorretos")
        }
        setCarregando(false)
      } else if (result?.ok) {
        setTheme("light")
        if (typeof window !== "undefined") {
          localStorage.setItem("theme", "light")
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
        window.location.href = "/"
      } else {
        setErro("Erro ao fazer login. Tente novamente.")
        setCarregando(false)
      }
    } catch {
      setErro("Erro ao fazer login. Tente novamente.")
      setCarregando(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle
          variant="outline"
          className="border-gray-200 bg-white/80 dark:bg-card/80 dark:border-border text-foreground backdrop-blur-xs"
        />
      </div>
      <Card className="w-full max-w-md p-8 shadow-xl border-blue-100 dark:border-border dark:bg-card">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-md">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400">MAPS-CS</h1>
          <p className="text-sm text-muted-foreground mt-1">APS Campos Sales</p>
          <p className="text-xs text-muted-foreground mt-2">
            Monitoramento da Atenção Primária em Saúde — Campos Sales
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu.email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <div
              role="alert"
              className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm"
            >
              {erro}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>

      <p className="absolute bottom-4 text-xs text-muted-foreground/80">
        Desenvolvido por <span className="font-medium text-foreground/80">Ednario Andrade</span>
      </p>
    </div>
  )
}
