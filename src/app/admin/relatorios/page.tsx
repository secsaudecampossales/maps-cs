"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Printer, UserPlus, FileEdit, Baby, Syringe } from "lucide-react"
import Link from "next/link"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

interface RelatorioMensalData {
  periodo: { mes: number; ano: number; nomeMes: string }
  resumo: {
    novosCadastros: number
    prontuariosAtualizados: number
    partosNoMes: number
    totalExamesVacinas: number
  }
  porRisco: { baixo: number; intermediario: number; alto: number }
  porEtnia: { etnia: string; quantidade: number }[]
  porUBS: { ubs: string; quantidade: number }[]
  examesPorTipo: { tipo: string; quantidade: number; percentual: string }[]
}

export default function RelatoriosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [relatorio, setRelatorio] = useState<RelatorioMensalData | null>(null)
  const [mes, setMes] = useState(() => (new Date().getMonth() + 1).toString())
  const [ano, setAno] = useState(() => new Date().getFullYear().toString())

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/")
      return
    }
  }, [status, session, router])

  const gerarRelatorio = async () => {
    setLoading(true)
    setRelatorio(null)
    try {
      const params = new URLSearchParams({ mes, ano })
      const response = await fetch(`/api/admin/relatorios/mensal?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRelatorio(data)
      } else {
        const err = await response.json()
        alert(err.error || "Erro ao gerar relatório")
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      alert("Erro ao gerar relatório")
    } finally {
      setLoading(false)
    }
  }

  const imprimirOuPDF = () => {
    if (!relatorio) return

    const doc = new jsPDF("portrait", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    let yPos = margin

    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text(
      `Relatório Mensal - ${relatorio.periodo.nomeMes} de ${relatorio.periodo.ano}`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    )
    yPos += 10

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      yPos,
      { align: "center" }
    )
    yPos += 14

    // Resumo
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Resumo do Mês", margin, yPos)
    yPos += 6
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`• Novos cadastros: ${relatorio.resumo.novosCadastros} gestante(s)`, margin, yPos)
    yPos += 5
    doc.text(`• Prontuários atualizados: ${relatorio.resumo.prontuariosAtualizados}`, margin, yPos)
    yPos += 5
    doc.text(`• Partos no mês: ${relatorio.resumo.partosNoMes}`, margin, yPos)
    yPos += 5
    doc.text(`• Exames e vacinas realizados: ${relatorio.resumo.totalExamesVacinas}`, margin, yPos)
    yPos += 10

    // Por risco
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("Gestantes por Risco (novos cadastros)", margin, yPos)
    yPos += 6
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Baixo: ${relatorio.porRisco.baixo} | Intermediário: ${relatorio.porRisco.intermediario} | Alto: ${relatorio.porRisco.alto}`, margin, yPos)
    yPos += 10

    // Por etnia (se houver)
    if (relatorio.porEtnia.length > 0) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Por Etnia", margin, yPos)
      yPos += 6
      relatorio.porEtnia.forEach((e) => {
        doc.setFont("helvetica", "normal")
        doc.text(`• ${e.etnia}: ${e.quantidade}`, margin, yPos)
        yPos += 5
      })
      yPos += 5
    }

    // Exames por tipo
    if (relatorio.examesPorTipo.length > 0) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text("Exames e Vacinas por Tipo", margin, yPos)
      yPos += 6

      const tableData = relatorio.examesPorTipo.map((item) => [
        item.tipo,
        String(item.quantidade),
        `${item.percentual}%`,
      ])

      autoTable(doc, {
        startY: yPos,
        head: [["TIPO", "QUANTIDADE", "PERCENTUAL"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: "bold" },
        margin: { left: margin, right: margin },
      })
    }

    doc.save(`relatorio_mensal_${relatorio.periodo.mes}_${relatorio.periodo.ano}.pdf`)
  }

  const anos = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i)

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!session?.user?.isAdmin) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Gere relatórios mensais de tudo que aconteceu no período
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">Voltar ao Admin</Button>
        </Link>
      </div>

      {/* Selecionar Período */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Período</CardTitle>
          <CardDescription>Escolha o mês e ano para gerar o relatório</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 min-w-[140px]">
              <label className="text-sm font-medium">Mês</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((nome, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-[120px]">
              <label className="text-sm font-medium">Ano</label>
              <Select value={ano} onValueChange={setAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {anos.map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={gerarRelatorio} disabled={loading} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {loading ? "Gerando..." : "Gerar Relatório"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relatório gerado */}
      {relatorio && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Relatório - {relatorio.periodo.nomeMes} de {relatorio.periodo.ano}</CardTitle>
                <CardDescription>Resumo completo do que aconteceu no mês</CardDescription>
              </div>
              <Button onClick={imprimirOuPDF} variant="outline" className="gap-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 border-green-200 dark:border-green-800">
                <Printer className="h-4 w-4" />
                Imprimir/PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo do mês */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Resumo do Mês</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <UserPlus className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Novos Cadastros</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{relatorio.resumo.novosCadastros}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <FileEdit className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Prontuários Atualizados</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{relatorio.resumo.prontuariosAtualizados}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <Baby className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Partos no Mês</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{relatorio.resumo.partosNoMes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <Syringe className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-xs font-medium text-purple-800 dark:text-purple-200">Exames e Vacinas</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{relatorio.resumo.totalExamesVacinas}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Por risco e etnia */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Gestantes por Risco (novos cadastros)</h3>
                <div className="flex flex-wrap gap-3">
                  <span className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-200 text-sm">
                    Baixo: {relatorio.porRisco.baixo}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-200 text-sm">
                    Intermediário: {relatorio.porRisco.intermediario}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-200 text-sm">
                    Alto: {relatorio.porRisco.alto}
                  </span>
                </div>
              </div>
              {relatorio.porEtnia.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Por Etnia</h3>
                  <div className="flex flex-wrap gap-2">
                    {relatorio.porEtnia.map((e) => (
                      <span key={e.etnia} className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm">
                        {e.etnia}: {e.quantidade}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Por UBS */}
            {relatorio.porUBS.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Cadastros por UBS</h3>
                <div className="flex flex-wrap gap-2">
                  {relatorio.porUBS.map((u) => (
                    <span key={u.ubs} className="px-3 py-1.5 rounded-full bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-200 text-sm">
                      {u.ubs}: {u.quantidade}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Exames e vacinas por tipo */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Exames e Vacinas por Tipo</h3>
              {relatorio.examesPorTipo.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left p-3 font-semibold">TIPO</th>
                        <th className="text-right p-3 font-semibold">QUANTIDADE</th>
                        <th className="text-right p-3 font-semibold">PERCENTUAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatorio.examesPorTipo.map((item) => (
                        <tr key={item.tipo} className="border-t">
                          <td className="p-3">{item.tipo}</td>
                          <td className="p-3 text-right font-medium">{item.quantidade}</td>
                          <td className="p-3 text-right">{item.percentual}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground py-4">Nenhum exame ou vacina registrado entre as gestantes cadastradas no período.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
