"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown, Filter, BarChart3 } from "lucide-react"
import Link from "next/link"

interface UBS {
  id: string
  nome: string
  endereco: string
}

interface RelatorioData {
  gestantes: any[]
  estatisticas: {
    total: number
    porRisco: {
      baixo: number
      intermediario: number
      alto: number
    }
    porEtnia: Record<string, number>
  }
  filtros: {
    ubsId: string | null
    risco: string | null
    etnia: string | null
    dataInicio: string | null
    dataFim: string | null
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ubsList, setUbsList] = useState<UBS[]>([])
  const [relatorio, setRelatorio] = useState<RelatorioData | null>(null)
  const [filtros, setFiltros] = useState({
    ubsId: "",
    risco: "",
    etnia: "",
    dataInicio: "",
    dataFim: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/")
      return
    }
    if (status === "authenticated") {
      fetchUBS()
    }
  }, [status, session, router])

  const fetchUBS = async () => {
    try {
      const response = await fetch("/api/admin/ubs")
      if (response.ok) {
        const ubs = await response.json()
        setUbsList(ubs)
      }
    } catch (error) {
      console.error("Erro ao buscar UBS:", error)
    }
  }

  const gerarRelatorio = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtros.ubsId) params.append("ubsId", filtros.ubsId)
      if (filtros.risco) params.append("risco", filtros.risco)
      if (filtros.etnia) params.append("etnia", filtros.etnia)
      if (filtros.dataInicio) params.append("dataInicio", filtros.dataInicio)
      if (filtros.dataFim) params.append("dataFim", filtros.dataFim)

      const response = await fetch(`/api/admin/relatorios?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRelatorio(data)
      } else {
        alert("Erro ao gerar relatório")
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      alert("Erro ao gerar relatório")
    } finally {
      setLoading(false)
    }
  }

  const limparFiltros = () => {
    setFiltros({
      ubsId: "",
      risco: "",
      etnia: "",
      dataInicio: "",
      dataFim: "",
    })
    setRelatorio(null)
  }

  const exportarCSV = () => {
    if (!relatorio) return

    const headers = [
      "Nome",
      "Cartão SUS",
      "DUM",
      "DPP",
      "Etnia",
      "Gestações Anteriores",
      "Risco",
      "Descrição Risco",
      "Motivo Alto Risco",
    ]

    const rows = relatorio.gestantes.map((g) => [
      g.nome,
      g.cartaoSus,
      new Date(g.dum).toLocaleDateString("pt-BR"),
      new Date(g.dpp).toLocaleDateString("pt-BR"),
      g.etnia,
      g.gestacoesAnteriores,
      g.risco,
      g.descricaoRisco || "",
      g.motivoAltoRisco || "",
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio_gestantes_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!session?.user?.isAdmin) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Área Administrativa</h1>
          <p className="text-gray-600 mt-1">Relatórios customizados de gestantes</p>
        </div>
        <Link href="/">
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
          <CardDescription>Configure os filtros para gerar relatórios personalizados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ubsId">UBS</Label>
              <Select
                value={filtros.ubsId || undefined}
                onValueChange={(value) => setFiltros({ ...filtros, ubsId: value })}
              >
                <SelectTrigger id="ubsId">
                  <SelectValue placeholder="Todas as UBS" />
                </SelectTrigger>
                <SelectContent>
                  {ubsList.map((ubs) => (
                    <SelectItem key={ubs.id} value={ubs.id}>
                      {ubs.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risco">Nível de Risco</Label>
              <Select
                value={filtros.risco || undefined}
                onValueChange={(value) => setFiltros({ ...filtros, risco: value })}
              >
                <SelectTrigger id="risco">
                  <SelectValue placeholder="Todos os riscos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Risco Baixo">Risco Baixo</SelectItem>
                  <SelectItem value="Risco Intermediário">Risco Intermediário</SelectItem>
                  <SelectItem value="Risco Alto">Risco Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="etnia">Etnia</Label>
              <Select
                value={filtros.etnia || undefined}
                onValueChange={(value) => setFiltros({ ...filtros, etnia: value })}
              >
                <SelectTrigger id="etnia">
                  <SelectValue placeholder="Todas as etnias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Branco">Branco</SelectItem>
                  <SelectItem value="Preto">Preto</SelectItem>
                  <SelectItem value="Pardo">Pardo</SelectItem>
                  <SelectItem value="Indígena">Indígena</SelectItem>
                  <SelectItem value="Amarelo">Amarelo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={gerarRelatorio} disabled={loading} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {loading ? "Gerando..." : "Gerar Relatório"}
            </Button>
            <Button variant="outline" onClick={limparFiltros}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {relatorio && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estatísticas do Relatório</CardTitle>
                  <CardDescription>
                    {relatorio.estatisticas.total} gestante(s) encontrada(s)
                  </CardDescription>
                </div>
                <Button onClick={exportarCSV} variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {relatorio.estatisticas.total}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Risco Baixo</p>
                  <p className="text-2xl font-bold text-green-600">
                    {relatorio.estatisticas.porRisco.baixo}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Risco Intermediário</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {relatorio.estatisticas.porRisco.intermediario}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Risco Alto</p>
                  <p className="text-2xl font-bold text-red-600">
                    {relatorio.estatisticas.porRisco.alto}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Gestantes */}
          <Card>
            <CardHeader>
              <CardTitle>Gestantes do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Cartão SUS</th>
                      <th className="text-left p-2">DUM</th>
                      <th className="text-left p-2">DPP</th>
                      <th className="text-left p-2">Etnia</th>
                      <th className="text-left p-2">Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.gestantes.map((gestante) => (
                      <tr key={gestante.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{gestante.nome}</td>
                        <td className="p-2">{gestante.cartaoSus}</td>
                        <td className="p-2">
                          {new Date(gestante.dum).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-2">
                          {new Date(gestante.dpp).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-2">{gestante.etnia}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              gestante.risco === "Risco Alto"
                                ? "bg-red-100 text-red-800"
                                : gestante.risco === "Risco Intermediário"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {gestante.risco}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

