"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(false)

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
        console.error("Erro no login:", result.error)
        setErro("Email ou senha incorretos")
        setCarregando(false)
      } else if (result?.ok) {
        // Aguardar um pouco para garantir que a sessão foi criada
        await new Promise(resolve => setTimeout(resolve, 100))
        window.location.href = "/"
      } else {
        console.error("Resultado inesperado:", result)
        setErro("Erro ao fazer login. Tente novamente.")
        setCarregando(false)
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error)
      setErro("Erro ao fazer login. Tente novamente.")
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">MAPS-CS</h1>
          <p className="text-gray-600">Monitoramento da Atenção Primaria em Saúde - Campos Sales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {erro}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={carregando}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  )
}

