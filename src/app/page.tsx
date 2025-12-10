"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Users, AlertTriangle, AlertCircle, Baby, Trash2, Eye } from "lucide-react"

interface Gestante {
  id: string
  nome: string
  dum: string
  dpp: string
  etnia: string
  risco: string
  createdAt: string
}

interface Stats {
  totalGestantes: number
  gestantesAltoRisco: number
  gestantesRiscoIntermediario: number
  partosEsteMes: number
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [gestantes, setGestantes] = useState<Gestante[]>([])
  const [stats, setStats] = useState<Stats>({
    totalGestantes: 0,
    gestantesAltoRisco: 0,
    gestantesRiscoIntermediario: 0,
    partosEsteMes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cleaning, setCleaning] = useState(false)
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [gestantesRes, statsRes] = await Promise.all([
        fetch("/api/gestantes"),
        fetch("/api/gestantes/stats"),
      ])

      // Verificar se as respostas são JSON válidas
      const gestantesContentType = gestantesRes.headers.get("content-type")
      const statsContentType = statsRes.headers.get("content-type")

      if (!gestantesRes.ok) {
        throw new Error(`Erro ao buscar gestantes: ${gestantesRes.status}`)
      }

      if (!statsRes.ok) {
        throw new Error(`Erro ao buscar estatísticas: ${statsRes.status}`)
      }

      if (!gestantesContentType?.includes("application/json")) {
        const text = await gestantesRes.text()
        console.error("Resposta não é JSON:", text.substring(0, 200))
        throw new Error("Resposta da API não é JSON válido")
      }

      if (!statsContentType?.includes("application/json")) {
        const text = await statsRes.text()
        console.error("Resposta não é JSON:", text.substring(0, 200))
        throw new Error("Resposta da API não é JSON válido")
      }

      const gestantesData = await gestantesRes.json()
      const statsData = await statsRes.json()

      // Verificar se há erro na resposta
      if (gestantesData.error) {
        console.error("Erro da API:", gestantesData)
        if (gestantesData.details) {
          console.error("Detalhes do erro:", gestantesData.details)
        }
        throw new Error(gestantesData.error)
      }

      if (statsData.error) {
        console.error("Erro da API de stats:", statsData)
        if (statsData.details) {
          console.error("Detalhes do erro:", statsData.details)
        }
        throw new Error(statsData.error)
      }

      setGestantes(gestantesData)
      setStats(statsData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      // Definir valores padrão em caso de erro
      setGestantes([])
      setStats({
        totalGestantes: 0,
        gestantesAltoRisco: 0,
        gestantesRiscoIntermediario: 0,
        partosEsteMes: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case "Risco Baixo":
        return "bg-green-100 text-green-800 border-green-300"
      case "Risco Intermediário":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "Risco Alto":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const handleDelete = async (gestanteId: string) => {
    const gestante = gestantes.find((g) => g.id === gestanteId)
    const nome = gestante?.nome ? ` de ${gestante.nome}` : ""
    if (!confirm(`Tem certeza que deseja excluir a gestante${nome}?`)) {
      return
    }

    setDeletingId(gestanteId)
    try {
      const response = await fetch(`/api/gestantes/${gestanteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao excluir gestante")
      }

      await fetchData()
    } catch (error) {
      console.error("Erro ao excluir gestante:", error)
      alert("Não foi possível excluir a gestante. Tente novamente.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleCleanupExGestantes = async () => {
    setShowCleanupConfirm(false)
    setCleaning(true)
    try {
      const response = await fetch("/api/admin/gestantes/cleanup", {
        method: "POST",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao remover ex-gestantes")
      }
      await fetchData()
    } catch (error) {
      console.error("Erro ao remover ex-gestantes:", error)
      alert("Não foi possível remover ex-gestantes. Tente novamente.")
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="space-y-8">
      {showCleanupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Remover Ex-Gestantes</h2>
              <p className="text-sm text-gray-600 mt-1">
                Isso vai excluir automaticamente todas as gestantes cuja DPP já passou.
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                Confirme apenas se já registrou o desfecho dessas gestantes. A remoção é definitiva.
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCleanupConfirm(false)}
                  disabled={cleaning}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCleanupExGestantes}
                  disabled={cleaning}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {cleaning ? "Removendo..." : "Confirmar remoção"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Título e Botão de Adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitoramento de Gestantes - APS Campos Sales</p>
        </div>
        <div className="flex gap-2">
          {session?.user?.isAdmin && (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setShowCleanupConfirm(true)}
              disabled={cleaning}
            >
              <Trash2 className="h-4 w-4" />
              {cleaning ? "Removendo..." : "Remover Ex-Gestantes"}
            </Button>
          )}
          <Link href="/gestantes/novo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Gestante
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Gestantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalGestantes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gestantes cadastradas no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestantes de Alto Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.gestantesAltoRisco}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requerem atenção especial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risco Intermediário</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.gestantesRiscoIntermediario}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monitoramento reforçado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partos Este Mês</CardTitle>
            <Baby className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.partosEsteMes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              DPP previsto para este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Gestantes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Gestantes</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as gestantes cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : gestantes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">Nenhuma gestante cadastrada ainda.</p>
              <Link href="/gestantes/novo">
                <Button>Cadastrar Primeira Gestante</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-gray-700">Nome</th>
                    <th className="text-left p-4 font-semibold text-gray-700">DUM</th>
                    <th className="text-left p-4 font-semibold text-gray-700">DPP</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Etnia</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Risco</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {gestantes.map((gestante) => (
                    <tr key={gestante.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{gestante.nome}</td>
                      <td className="p-4">{formatDate(gestante.dum)}</td>
                      <td className="p-4">{formatDate(gestante.dpp)}</td>
                      <td className="p-4">{gestante.etnia}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getRiscoColor(
                            gestante.risco
                          )}`}
                        >
                          {gestante.risco}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link href={`/gestantes/${gestante.id}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Edit className="h-3 w-3" />
                              Editar
                            </Button>
                          </Link>
                          <Link href={`/gestantes/${gestante.id}/visualizar`}>
                            <Button variant="outline" size="sm" className="gap-2 bg-blue-500 text-white">
                              <Eye className="h-3 w-3" />
                              Ver
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDelete(gestante.id)}
                            disabled={deletingId === gestante.id}
                          >
                            <Trash2 className="h-3 w-3" />
                            {deletingId === gestante.id ? "Excluindo..." : "Excluir"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
