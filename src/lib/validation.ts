/**
 * Utilitários de validação e sanitização de dados para o sistema MAPS-CS
 */

const ETNIAS_VALIDAS = ["Branco", "Preto", "Pardo", "Indígena", "Amarelo"] as const
const RISCOS_VALIDOS = ["Risco Baixo", "Risco Intermediário", "Risco Alto"] as const

/**
 * Remove tags HTML e caracteres de controle perigosos de strings
 */
export function sanitizeText(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
    .replace(/<[^>]*>/g, "") // remove tags HTML
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // remove caracteres de controle ASCII
    .trim()
}

/**
 * Validação de Nome completo
 */
export function validateNome(nome: unknown): { valid: boolean; value?: string; error?: string } {
  const sanitized = sanitizeText(nome)
  if (!sanitized) {
    return { valid: false, error: "Nome é obrigatório." }
  }
  if (sanitized.length < 2 || sanitized.length > 150) {
    return { valid: false, error: "Nome deve conter entre 2 e 150 caracteres." }
  }
  return { valid: true, value: sanitized }
}

/**
 * Validação de Cartão Nacional de Saúde (CNS / Cartão SUS)
 * Formato padrão nacional do DATASUS: 15 dígitos numéricos.
 */
export function validateCartaoSus(cartaoSus: unknown): { valid: boolean; value?: string; error?: string } {
  if (!cartaoSus) {
    return { valid: false, error: "Cartão do SUS é obrigatório." }
  }
  const digits = String(cartaoSus).replace(/\D/g, "")
  if (digits.length !== 15) {
    return { valid: false, error: "Cartão do SUS inválido. Deve conter exatamente 15 dígitos numéricos." }
  }
  return { valid: true, value: digits }
}

/**
 * Validação de telefone (DDD + 8 ou 9 dígitos)
 */
export function validateTelefone(telefone: unknown): { valid: boolean; value?: string | null; error?: string } {
  if (telefone === undefined || telefone === null || telefone === "") {
    return { valid: true, value: null }
  }
  const digits = String(telefone).replace(/\D/g, "")
  if (digits.length === 0) {
    return { valid: true, value: null }
  }
  if (digits.length < 10 || digits.length > 11) {
    return { valid: false, error: "Telefone inválido. Informe DDD + número com 10 ou 11 dígitos." }
  }
  return { valid: true, value: digits }
}

/**
 * Validação de data
 */
export function validateDate(
  dateValue: unknown,
  fieldName: string,
  options?: { allowFuture?: boolean; maxYearsAgo?: number }
): { valid: boolean; value?: Date; error?: string } {
  if (!dateValue) {
    return { valid: false, error: `${fieldName} é obrigatória.` }
  }

  const d = new Date(String(dateValue))
  if (Number.isNaN(d.getTime())) {
    return { valid: false, error: `${fieldName} contém uma data inválida.` }
  }

  const now = new Date()
  if (!options?.allowFuture && d > now) {
    return { valid: false, error: `${fieldName} não pode ser uma data futura.` }
  }

  if (options?.maxYearsAgo) {
    const minDate = new Date()
    minDate.setFullYear(minDate.getFullYear() - options.maxYearsAgo)
    if (d < minDate) {
      return { valid: false, error: `${fieldName} está fora do limite razoável.` }
    }
  }

  return { valid: true, value: d }
}

/**
 * Validação de Etnia
 */
export function validateEtnia(etnia: unknown): { valid: boolean; value?: string; error?: string } {
  const sanitized = sanitizeText(etnia)
  if (!sanitized) {
    return { valid: false, error: "Etnia é obrigatória." }
  }
  if (!ETNIAS_VALIDAS.includes(sanitized as typeof ETNIAS_VALIDAS[number])) {
    return { valid: false, error: `Etnia inválida. Valores permitidos: ${ETNIAS_VALIDAS.join(", ")}.` }
  }
  return { valid: true, value: sanitized }
}

/**
 * Validação de Risco Gestacional
 */
export function validateRisco(risco: unknown): { valid: boolean; value?: string; error?: string } {
  const sanitized = sanitizeText(risco)
  if (!sanitized) {
    return { valid: false, error: "Nível de risco é obrigatório." }
  }
  if (!RISCOS_VALIDOS.includes(sanitized as typeof RISCOS_VALIDOS[number])) {
    return { valid: false, error: `Risco inválido. Valores permitidos: ${RISCOS_VALIDOS.join(", ")}.` }
  }
  return { valid: true, value: sanitized }
}
