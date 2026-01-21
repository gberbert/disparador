$source = "c:\Users\K\OneDrive\Documentos\PROJETOS ANTIGRAVITY 2\disparador"
$dest = "C:\Dev\ANTIGRAVITY\disparador"
$remote = "https://github.com/gberbert/disparador.git"

Write-Host "--- Iniciando Migração Forçada ---"
Write-Host "Origem: $source"
Write-Host "Destino: $dest"

# Garantir que destino existe
if (!(Test-Path $dest)) { New-Item -ItemType Directory -Force -Path $dest | Out-Null }

# 1. Copia via Robocopy
# /E = recursivo
# /XD = excluir pastas
# /XF = excluir arquivos
# /R:1 /W:1 = tentar 1 vez, esperar 1s (falha rápido em erros de nuvem)
$roboArgs = @(
    $source, $dest, "/E",
    "/XD", "node_modules", ".git", "dist", "build", ".vscode", "coverage",
    "/XF", ".env", ".env.local", "*.log", "npm-debug.log",
    "/R:1", "/W:1" 
)

Write-Host "Copiando arquivos... (Ignore erros se o arquivo ja existir e for igual)"
Write-Host "AVISO: Se o OneDrive nao estiver rodando, arquivos 'online-only' falharao."
& robocopy $roboArgs

# 2. Git Setup
Set-Location $dest

if (Test-Path ".git") {
    Write-Host "Removendo configuração .git antiga..."
    Remove-Item .git -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Inicializando Git..."
git init
git branch -M main
git remote add origin $remote

Write-Host "Adicionando arquivos..."
git add .
git commit -m "Migracao automatica para C:\Dev devido a erros no OneDrive"

Write-Host "Realizando Push Force..."
git push -u origin main --force

Write-Host "--- Concluido ---"
