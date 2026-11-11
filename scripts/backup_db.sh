#!/usr/bin/env bash
set -euo pipefail

# Diretórios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/maps_cs_backup_${TIMESTAMP}.dump"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"

# Carregar variáveis do .env se existir
if [ -f "${PROJECT_ROOT}/.env" ]; then
  # export variáveis sem sobrescrever as já definidas no ambiente
  set -a
  # shellcheck source=/dev/null
  source "${PROJECT_ROOT}/.env"
  set +a
fi

DB_URL="${DIRECT_URL:-${DATABASE_URL:-}}"

if [ -z "${DB_URL}" ]; then
  echo "[-] ERRO: Nem DIRECT_URL nem DATABASE_URL foram definidas." >&2
  exit 1
fi

echo "[+] Iniciando backup do banco de dados MAPS-CS..."
echo "[+] Destino: ${BACKUP_FILE}"

# Executa pg_dump em formato custom comprimido (-Fc)
if pg_dump --format=c --no-owner --no-privileges --dbname="${DB_URL}" --file="${BACKUP_FILE}"; then
  # Gerar checksum SHA-256
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
  fi

  FILE_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
  echo "[+] Backup concluído com sucesso!"
  echo "[+] Tamanho do arquivo: ${FILE_SIZE}"
  echo "[+] Checksum gerado em: ${CHECKSUM_FILE}"

  # Política de retenção local: remove backups com mais de 30 dias
  echo "[+] Aplicando política de retenção (limpeza de backups > 30 dias)..."
  find "${BACKUP_DIR}" -name "maps_cs_backup_*.dump" -mtime +30 -exec rm -f {} + || true
  find "${BACKUP_DIR}" -name "maps_cs_backup_*.dump.sha256" -mtime +30 -exec rm -f {} + || true
else
  echo "[-] Falha ao gerar backup com pg_dump." >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi
