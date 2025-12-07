"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { addDays, format } from "date-fns"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"

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
}

interface UBS {
  id: string
  nome: string
  endereco: string
}

export default function EditarGestantePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ubsList, setUbsList] = useState<UBS[]>([])
  const [formData, setFormData] = useState({
    nome: "",
    cartaoSus: "",
    ubsId: "",
    dum: "",
    dpp: "",
    etnia: "",
    gestacoesAnteriores: "0",
    risco: "",
    descricaoRisco: "",
    motivoAltoRisco: "",
    exames: {
      rotina1: false,
      rotina2: false,
      rotina3: false,
      ultrassom1: false,
      ultrassom2: false,
      ultrassom3: false,
    },
  })

  useEffect(() => {
    fetchUBS()
    if (id) {
      fetchGestante()
    }
  }, [id])

  const fetchUBS = async () => {
    try {
      const response = await fetch("/api/ubs")
      if (response.ok) {
        const ubs = await response.json()
        setUbsList(ubs)
      }
    } catch (error) {
      console.error("Erro ao buscar UBS:", error)
    }
  }

  const fetchGestante = async () => {
    try {
      const response = await fetch(`/api/gestantes/${id}`)
      if (response.ok) {
        const gestante: Gestante = await response.json()
        setFormData({
          nome: gestante.nome,
          cartaoSus: gestante.cartaoSus || "",
          ubsId: gestante.ubsId || "",
          dum: format(new Date(gestante.dum), "yyyy-MM-dd"),
          dpp: format(new Date(gestante.dpp), "yyyy-MM-dd"),
          etnia: gestante.etnia,
          gestacoesAnteriores: gestante.gestacoesAnteriores.toString(),
          risco: gestante.risco,
          descricaoRisco: gestante.descricaoRisco || "",
          motivoAltoRisco: gestante.motivoAltoRisco || "",
          exames: {
            rotina1: gestante.exameRotina1Trimestre,
            rotina2: gestante.exameRotina2Trimestre,
            rotina3: gestante.exameRotina3Trimestre,
            ultrassom1: gestante.ultrassom1Trimestre,
            ultrassom2: gestante.ultrassom2Trimestre,
            ultrassom3: gestante.ultrassom3Trimestre,
          },
        })
      } else {
        alert("Gestante não encontrada")
        router.push("/")
      }
    } catch (error) {
      console.error("Erro ao carregar gestante:", error)
      alert("Erro ao carregar dados da gestante")
    } finally {
      setLoading(false)
    }
  }

  const handleDumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dum = e.target.value
    if (dum) {
      const dpp = addDays(new Date(dum), 280)
      setFormData({
        ...formData,
        dum,
        dpp: format(dpp, "yyyy-MM-dd"),
      })
    } else {
      setFormData({
        ...formData,
        dum,
        dpp: "",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.cartaoSus || !formData.ubsId || !formData.dum || !formData.etnia || !formData.risco) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    if (formData.risco === "Risco Alto" && !formData.motivoAltoRisco) {
      alert("Por favor, informe o motivo do alto risco.")
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/gestantes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/")
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Erro ao salvar: ${error.error}`)
      }
    } catch (error) {
      console.error("Erro ao salvar gestante:", error)
      alert("Erro ao salvar gestante. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta gestante?")) {
      return
    }

    try {
      const response = await fetch(`/api/gestantes/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/")
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Erro ao excluir: ${error.error}`)
      }
    } catch (error) {
      console.error("Erro ao excluir gestante:", error)
      alert("Erro ao excluir gestante. Tente novamente.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Gestante</h1>
            <p className="text-gray-600 mt-1">Atualize os dados da gestante</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Excluir
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Identificação e Datas */}
        <Card>
          <CardHeader>
            <CardTitle>Identificação e Datas</CardTitle>
            <CardDescription>Dados básicos da gestante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Gestante *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cartaoSus">Cartão do SUS *</Label>
              <Input
                id="cartaoSus"
                value={formData.cartaoSus}
                onChange={(e) => setFormData({ ...formData, cartaoSus: e.target.value })}
                placeholder="Digite o número do cartão do SUS"
                required
                maxLength={15}
              />
              <p className="text-xs text-gray-500">
                Número do cartão do SUS (obrigatório e único)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubsId">UBS *</Label>
              <Select
                value={formData.ubsId || undefined}
                onValueChange={(value) => setFormData({ ...formData, ubsId: value })}
                required
              >
                <SelectTrigger id="ubsId">
                  <SelectValue placeholder="Selecione a UBS" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dum">DUM (Data da Última Menstruação) *</Label>
                <Input
                  id="dum"
                  type="date"
                  value={formData.dum}
                  onChange={handleDumChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dpp">DPP (Data Provável do Parto)</Label>
                <Input
                  id="dpp"
                  type="date"
                  value={formData.dpp}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Calculado automaticamente (DUM + 280 dias)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Dados Sociais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Sociais</CardTitle>
            <CardDescription>Informações demográficas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="etnia">Etnia *</Label>
              <Select
                value={formData.etnia}
                onValueChange={(value) => setFormData({ ...formData, etnia: value })}
                required
              >
                <SelectTrigger id="etnia">
                  <SelectValue placeholder="Selecione a etnia" />
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
          </CardContent>
        </Card>

        {/* 3. Classificação de Risco */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação de Risco</CardTitle>
            <CardDescription>Classifique o risco da gestação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risco">Nível de Risco *</Label>
                <Select
                  value={formData.risco}
                  onValueChange={(value) => setFormData({ ...formData, risco: value })}
                  required
                >
                  <SelectTrigger id="risco">
                    <SelectValue placeholder="Selecione o risco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Risco Baixo">Risco Baixo</SelectItem>
                    <SelectItem value="Risco Intermediário">Risco Intermediário</SelectItem>
                    <SelectItem value="Risco Alto">Risco Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gestacoesAnteriores">Gestações Anteriores (Quantas?)</Label>
                <Input
                  id="gestacoesAnteriores"
                  type="number"
                  min="0"
                  value={formData.gestacoesAnteriores}
                  onChange={(e) =>
                    setFormData({ ...formData, gestacoesAnteriores: e.target.value })
                  }
                />
              </div>
            </div>

            {formData.risco === "Risco Intermediário" && (
              <div className="space-y-2">
                <Label htmlFor="descricaoRisco">Descrição/Observação</Label>
                <Input
                  id="descricaoRisco"
                  value={formData.descricaoRisco}
                  onChange={(e) =>
                    setFormData({ ...formData, descricaoRisco: e.target.value })
                  }
                  placeholder="Descreva o motivo do risco intermediário"
                />
              </div>
            )}

            {formData.risco === "Risco Alto" && (
              <div className="space-y-2">
                <Label htmlFor="motivoAltoRisco">Porquê? (Motivo do alto risco) *</Label>
                <Input
                  id="motivoAltoRisco"
                  value={formData.motivoAltoRisco}
                  onChange={(e) =>
                    setFormData({ ...formData, motivoAltoRisco: e.target.value })
                  }
                  placeholder="Informe o motivo do alto risco"
                  required={formData.risco === "Risco Alto"}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Monitoramento de Exames */}
        <Card>
          <CardHeader>
            <CardTitle>Monitoramento de Exames</CardTitle>
            <CardDescription>Marque os exames realizados por trimestre</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Exames de Rotina */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Exames de Rotina</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rotina1"
                      checked={formData.exames.rotina1}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, rotina1: checked === true },
                        })
                      }
                    />
                    <Label htmlFor="rotina1" className="cursor-pointer">
                      1º Trimestre
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rotina2"
                      checked={formData.exames.rotina2}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, rotina2: checked === true },
                        })
                      }
                    />
                    <Label htmlFor="rotina2" className="cursor-pointer">
                      2º Trimestre
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rotina3"
                      checked={formData.exames.rotina3}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, rotina3: checked === true },
                        })
                      }
                    />
                    <Label htmlFor="rotina3" className="cursor-pointer">
                      3º Trimestre
                    </Label>
                  </div>
                </div>
              </div>

              {/* Ultrassonografia */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Ultrassonografia</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ultrassom1"
                      checked={formData.exames.ultrassom1}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, ultrassom1: checked === true },
                        })
                      }
                    />
                    <Label htmlFor="ultrassom1" className="cursor-pointer">
                      1º Tri
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ultrassom2"
                      checked={formData.exames.ultrassom2}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, ultrassom2: checked === true },
                        })
                      }
                    />
                    <Label htmlFor="ultrassom2" className="cursor-pointer">
                      2º Tri
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ultrassom3"
                      checked={formData.exames.ultrassom3}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          exames: { ...formData.exames, ultrassom3: checked === true },
                        })
                      }
                    />
                    <Label htmlFor="ultrassom3" className="cursor-pointer">
                      3º Tri
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Link href="/">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  )
}

