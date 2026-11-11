#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Carregar variáveis do .env se existir
if [ -f "${PROJECT_ROOT}/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "${PROJECT_ROOT}/.env"
  set +a
fi

TARGET_URL="${RESTORE_TARGET_URL:-${DIRECT_URL:-${DATABASE_URL:-}}}"
BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Uso: bash scripts/restore_db.sh <caminho_do_arquivo.dump>" >&2
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[-] Arquivo não encontrado: ${BACKUP_FILE}" >&2
  exit 1
fi

CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "${CHECKSUM_FILE}" ]; then
  echo "[+] Verificando integridade SHA-256..."
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum -c "${CHECKSUM_FILE}"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 -c "${CHECKSUM_FILE}"
  fi
fi

if [ -z "${TARGET_URL}" ]; then
  echo "[-] ERRO: Nenhuma URL de destino configurada (RESTORE_TARGET_URL, DIRECT_URL ou DATABASE_URL)." >&2
  exit 1
fi

echo "[!] ATENÇÃO: Esta operação irá restaurar o banco de dados e poderá sobrescrever dados existentes."
echo "[!] Destino: ${TARGET_URL}"
echo "[!] Arquivo: ${BACKUP_FILE}"

if [ "${FORCE_RESTORE:-false}" != "true" ]; then
  read -r -p "Deseja continuar? (digite 'sim' para confirmar): " CONFIRMATION
  if [ "${CONFIRMATION}" != "sim" ]; then
    echo "[-] Operação cancelada pelo usuário."
    exit 0
  fi
fi

echo "[+] Executando pg_restore..."
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="${TARGET_URL}" "${BACKUP_FILE}"
echo "[+] Restauração concluída com sucesso!"
