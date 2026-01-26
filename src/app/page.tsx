"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Edit,
  Users,
  AlertTriangle,
  AlertCircle,
  Baby,
  Trash2,
  Eye,
  Check,
  Filter,
} from "lucide-react"

interface Gestante {
  id: string
  nome: string
  cartaoSus?: string
  dum: string
  dpp: string
  etnia: string
  risco: string
  createdAt: string
  ubsId: string
}

interface Stats {
  totalGestantes: number
  gestantesAltoRisco: number
  gestantesRiscoIntermediario: number
  partosEsteMes: number
  partosDosUltimos3Meses: number
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [gestantes, setGestantes] = useState<Gestante[]>([])
  const [page, setPage] = useState(1)
   const [searchTerm, setSearchTerm] = useState("")
   const [showFilters, setShowFilters] = useState(false)
   const [riskFilter, setRiskFilter] = useState<"all" | "alto" | "intermediario">("all")
   const [partoFilter, setPartoFilter] = useState<"all" | "ultimos3Meses" | "estemes">("all")
  const [stats, setStats] = useState<Stats>({
    totalGestantes: 0,
    gestantesAltoRisco: 0,
    gestantesRiscoIntermediario: 0,
    partosEsteMes: 0,
    partosDosUltimos3Meses: 0,
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
      setPage(1)
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
        partosDosUltimos3Meses: 0,
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
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800"
      case "Risco Alto":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-300 dark:border-red-800"
      default:
        return "bg-gray-100 dark:bg-secondary text-gray-800 dark:text-foreground border-gray-300 dark:border-border"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const calculateWeeks = (dum: string) => {
    const dumDate = new Date(dum)
    const today = new Date()
    const diffTime = today.getTime() - dumDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(diffDays / 7)
    return weeks >= 0 ? weeks : 0
  }

  const isPartoUltimos3Meses = (dpp: string) => {
    const dppDate = new Date(dpp)
    const today = new Date()
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(today.getMonth() - 3)

    return dppDate >= threeMonthsAgo && dppDate <= today
  }

  const isPartoEsteMes = (dpp: string) => {
    const dppDate = new Date(dpp)
    const today = new Date()
    return dppDate.getMonth() === today.getMonth() && dppDate.getFullYear() === today.getFullYear()
  }

  const filteredGestantes = gestantes.filter((gestante) => {
    const term = searchTerm.trim().toLowerCase()

    const matchesSearch =
      term.length === 0 ||
      gestante.nome.toLowerCase().includes(term) ||
      (gestante.cartaoSus && gestante.cartaoSus.toLowerCase().includes(term))

    const matchesRisco =
      riskFilter === "all" ||
      (riskFilter === "alto" && gestante.risco === "Risco Alto") ||
      (riskFilter === "intermediario" && gestante.risco === "Risco Intermediário")

    const matchesParto =
      partoFilter === "all" || (partoFilter === "ultimos3Meses" && isPartoUltimos3Meses(gestante.dpp)) || (partoFilter === "estemes" && isPartoEsteMes(gestante.dpp))

    return matchesSearch && matchesRisco && matchesParto
  })

  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredGestantes.length / itemsPerPage))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedGestantes = filteredGestantes.slice(startIndex, startIndex + itemsPerPage)

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-card shadow-lg border border-gray-200 dark:border-border">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-border">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Remover Ex-Gestantes</h2>
              <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                Isso vai excluir automaticamente todas as gestantes cuja DPP já passou.
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-400">
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
          <h1 className="text-3xl font-bold dark:text-gray-200">Dashboard</h1>
          <p className="dark:text-gray-100 mt-2">Monitoramento de Gestantes - APS Campos Sales</p>
        </div>
        <div className="flex gap-2">
          {/* {session?.user?.isAdmin && (
            // <Button
            //   variant="destructive"
            //   className="gap-2"
            //   onClick={() => setShowCleanupConfirm(true)}
            //   disabled={cleaning}
            // >
            //   <Trash2 className="h-4 w-4" />
            //   {cleaning ? "Removendo..." : "Remover Ex-Gestantes"}
            // </Button>
          )} */}
          <Link href="/gestantes/novo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Gestante
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-5">
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
            <Baby className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.partosEsteMes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              DPP previsto para este mês
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partos nos últimos 3 meses</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.partosDosUltimos3Meses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Partos concluídos nos últimos 3 meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Gestantes */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Lista de Gestantes</CardTitle>
              <CardDescription>
                Visualize e gerencie todas as gestantes cadastradas
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex-1 md:w-64">
                <Input
                  placeholder="Buscar por nome ou cartão do SUS"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
                {(riskFilter !== "all" || partoFilter !== "all") && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRiskFilter("all")
                      setPartoFilter("all")
                      setPage(1)
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 grid gap-2 md:grid-cols-4">
              <Button
                type="button"
                variant={riskFilter === "alto" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  setRiskFilter((current) => (current === "alto" ? "all" : "alto"))
                  setPartoFilter("all")
                  setPage(1)
                }}
              >
                Gestantes de alto risco
              </Button>
              <Button
                type="button"
                variant={riskFilter === "intermediario" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  setRiskFilter((current) => (current === "intermediario" ? "all" : "intermediario"))
                  setPartoFilter("all")
                  setPage(1)
                }}
              >
                Gestantes de risco intermediário
              </Button>
              <Button
                type="button"
                variant={partoFilter === "estemes" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  setPartoFilter((current) => (current === "estemes" ? "all" : "estemes"))
                  setRiskFilter("all")
                  setPage(1)
                }}
              >
                Partos Este Mês
              </Button>
              <Button
                type="button"
                variant={partoFilter === "ultimos3Meses" ? "default" : "outline"}
                size="sm"
                className="justify-start"
                onClick={() => {
                  setPartoFilter((current) => (current === "ultimos3Meses" ? "all" : "ultimos3Meses"))
                  setRiskFilter("all")
                  setPage(1)
                }}
              >
                Partos nos últimos 3 meses
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-muted-foreground">Carregando...</div>
          ) : gestantes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-muted-foreground">
              <p className="mb-4">Nenhuma gestante cadastrada ainda.</p>
              <Link href="/gestantes/novo">
                <Button>Cadastrar Primeira Gestante</Button>
              </Link>
            </div>
          ) : filteredGestantes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-muted-foreground">
              <p className="mb-2">Nenhuma gestante encontrada com os filtros atuais.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setRiskFilter("all")
                  setPartoFilter("all")
                  setPage(1)
                }}
              >
                Limpar busca e filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-foreground">Nome</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-foreground">DUM</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-foreground">DPP</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-foreground">Semanas de Gestação</th>
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-foreground">Risco</th>
                    {session?.user?.isAdmin && (
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-foreground">UBS</th>
                    )}
                    <th className="text-left p-4 font-semibold text-gray-700 dark:text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGestantes.map((gestante) => (
                    <tr key={gestante.id} className="border-b border-border hover:bg-accent/50 dark:hover:bg-secondary/40 transition-colors">
                      <td className="p-4 font-medium text-foreground">{gestante.nome}</td>
                      <td className="p-4 text-foreground">{formatDate(gestante.dum)}</td>
                      <td className="p-4 text-foreground">{formatDate(gestante.dpp)}</td>
                      <td className="p-4 text-foreground">{calculateWeeks(gestante.dum)} semanas</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getRiscoColor(
                            gestante.risco
                          )}`}
                        >
                          {gestante.risco}
                        </span>
                      </td>
                      {session?.user?.isAdmin && (
                        <td className="p-4 font-medium text-foreground">{gestante.ubsId}</td>
                      )}
                      <td className="p-4 text-foreground">
                        <div className="flex gap-2">
                          <Link href={`/gestantes/${gestante.id}/visualizar`}>
                            <Button variant="outline" size="sm" className="gap-2 bg-blue-500 text-white">
                              <Eye className="h-3 w-3" />
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/gestantes/${gestante.id}`}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Edit className="h-3 w-3" />
                              Editar
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
          {!loading && gestantes.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
