"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"

interface Gestante {
  id: string
  nome: string
  cartaoSus: string
  ubsId: string
  dum: string
  dpp: string
  etnia: string
  gestacoesAnteriores: number
  risco: string
  descricaoRisco: string | null
  motivoAltoRisco: string | null
  exameRotina1Trimestre: boolean
  exameRotina2Trimestre: boolean
  exameRotina3Trimestre: boolean
  ultrassom1Trimestre: boolean
  ultrassom2Trimestre: boolean
  ultrassom3Trimestre: boolean
  vacinaHB: boolean
  vacinaDT: boolean
  vacinaInfluenza: boolean
  vacinaCovid19: boolean
  vacinaDTPA20Semana: boolean
  vacinaVSR28Semana: boolean
}

const formatCartaoSus = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 15)
  const parts = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 7))
  if (digits.length > 7) parts.push(digits.slice(7, 11))
  if (digits.length > 11) parts.push(digits.slice(11, 15))
  return parts.join(" ")
}

const formatDate = (value: string) => new Date(value).toLocaleDateString("pt-BR")

const yesNo = (value: boolean) => (value ? "Sim" : "Não")

const calculateWeeks = (dum: string) => {
  const dumDate = new Date(dum)
  const today = new Date()
  const diffTime = today.getTime() - dumDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(diffDays / 7)
  return weeks >= 0 ? weeks : 0
}

export default function VisualizarGestantePage() {
  const params = useParams()
  const id = params.id as string
  const [gestante, setGestante] = useState<Gestante | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGestante = async () => {
      try {
        const response = await fetch(`/api/gestantes/${id}`)
        if (!response.ok) {
          throw new Error("Gestante não encontrada")
        }
        const data = await response.json()
        setGestante(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar gestante")
      } finally {
        setLoading(false)
      }
    }

    fetchGestante()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando gestante...</p>
      </div>
    )
  }

  if (error || !gestante) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-foreground">{error || "Gestante não encontrada"}</p>
        <Link href="/">
          <Button variant="outline">Voltar ao dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{gestante.nome}</h1>
            <p className="text-muted-foreground">Informações completas do cadastro</p>
          </div>
        </div>
        <Link href={`/gestantes/${id}`}>
          <Button variant="secondary" className="gap-2">
            <Edit className="h-4 w-4" />
            Editar cadastro
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
          <CardDescription>Dados básicos e datas</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Nome" value={gestante.nome} />
          <InfoItem label="Cartão SUS" value={formatCartaoSus(gestante.cartaoSus || "")} />
          <InfoItem label="DUM" value={formatDate(gestante.dum)} />
          <InfoItem label="DPP" value={formatDate(gestante.dpp)} />
          <InfoItem label="Semanas de Gestação" value={`${calculateWeeks(gestante.dum)} semanas`} />
          <InfoItem label="UBS" value={gestante.ubsId} />
          <InfoItem label="Etnia" value={gestante.etnia} />
          <InfoItem label="Gestações Anteriores" value={gestante.gestacoesAnteriores.toString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Classificação de Risco</CardTitle>
          <CardDescription>Informações clínicas</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Nível de Risco" value={gestante.risco} />
          <InfoItem label="Descrição/Observação" value={gestante.descricaoRisco || "-"} />
          <InfoItem label="Motivo Alto Risco" value={gestante.motivoAltoRisco || "-"} />
        </CardContent>
      </Card>

      <Card className="grid grid-cols-2 justify-center">
        <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Exames de Rotina</CardTitle>
          </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <InfoItem label="Rotina 1º trimestre" value={yesNo(gestante.exameRotina1Trimestre)} />
          <InfoItem label="Rotina 2º trimestre" value={yesNo(gestante.exameRotina2Trimestre)} />
          <InfoItem label="Rotina 3º trimestre" value={yesNo(gestante.exameRotina3Trimestre)} />
        </CardContent>
      </Card>
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Ultrassom</CardTitle>
          </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <InfoItem label="Ultrassom 1º trimestre" value={yesNo(gestante.ultrassom1Trimestre)} />
          <InfoItem label="Ultrassom 2º trimestre" value={yesNo(gestante.ultrassom2Trimestre)} />
          <InfoItem label="Ultrassom 3º trimestre" value={yesNo(gestante.ultrassom3Trimestre)} />
        </CardContent>
      </Card>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vacinas</CardTitle>
          <CardDescription>Status de aplicação</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="HB - Hepatite B" value={yesNo(gestante.vacinaHB)} />
          <InfoItem label="DT - Dupla Adulto" value={yesNo(gestante.vacinaDT)} />
          <InfoItem label="Influenza" value={yesNo(gestante.vacinaInfluenza)} />
          <InfoItem label="Covid-19" value={yesNo(gestante.vacinaCovid19)} />
          <InfoItem label="DTPA 20ª semana" value={yesNo(gestante.vacinaDTPA20Semana)} />
          <InfoItem label="VSR 28ª semana" value={yesNo(gestante.vacinaVSR28Semana)} />
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-base font-semibold text-foreground">{value}</span>
    </div>
  )
}


