<#
.SYNOPSIS
  Script de backup do banco PostgreSQL para Windows / PowerShell.
#>
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackupDir = Join-Path $ProjectRoot "backups"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$EnvFile = Join-Path $ProjectRoot ".env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $name = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            if (-not [System.Environment]::GetEnvironmentVariable($name)) {
                [System.Environment]::SetEnvironmentVariable($name, $value)
            }
        }
    }
}

$DbUrl = [System.Environment]::GetEnvironmentVariable("DIRECT_URL")
if (-not $DbUrl) {
    $DbUrl = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
}

if (-not $DbUrl) {
    Write-Error "Nem DIRECT_URL nem DATABASE_URL foram encontradas."
    exit 1
}

$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$BackupFile = Join-Path $BackupDir "maps_cs_backup_${Timestamp}.dump"
$ChecksumFile = "${BackupFile}.sha256"

Write-Host "[+] Iniciando backup do banco de dados MAPS-CS..."
Write-Host "[+] Destino: $BackupFile"

& pg_dump --format=c --no-owner --no-privileges --dbname="$DbUrl" --file="$BackupFile"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao executar pg_dump."
    if (Test-Path $BackupFile) { Remove-Item $BackupFile -Force }
    exit 1
}

$Hash = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash
Set-Content -Path $ChecksumFile -Value "$Hash  $([System.IO.Path]::GetFileName($BackupFile))"

Write-Host "[+] Backup concluído com sucesso!"
Write-Host "[+] Checksum SHA-256 gravado em: $ChecksumFile"

# Limpeza de backups antigos (>30 dias)
Get-ChildItem -Path $BackupDir -Filter "maps_cs_backup_*" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force
