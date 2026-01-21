$source = "c:\Users\K\OneDrive\Documentos\PROJETOS ANTIGRAVITY 2\disparador"
$dest = "C:\Dev\ANTIGRAVITY\disparador"
$remoteUrl = "https://github.com/gberbert/disparador.git"

Write-Host "Iniciando migracao de $source para $dest..."

# 1. Criar diretorio de destino
if (!(Test-Path -Path $dest)) {
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Write-Host "Diretorio criado: $dest"
}

# 2. Copiar arquivos excluindo node_modules, .git, e arquivos do ambiente
# Usando Robocopy para robustez. /E = recusivo, /XD = excluir diretorios, /XF = excluir arquivos
# Excluindo especificamente pastas node_modules em qualquer profundidade e a pasta .git
# Nota: Robocopy retorna exit ranges, entao ignoramos erros < 8
$robocopyParams = @(
    $source,
    $dest,
    "/E",
    "/XD", ".git", "node_modules", "dist", "build", "coverage", ".vscode",
    "/XF", ".env", ".env.local", ".DS_Store", "Thumbs.db", "*.log"
)

Write-Host "Copiando arquivos (pode levar alguns instantes se precisar baixar do OneDrive)..."
& robocopy $robocopyParams
if ($LASTEXITCODE -ge 8) {
    Write-Error "Houve erros criticos na copia (Robocopy Exit Code: $LASTEXITCODE)."
    # Nao paramos forçadamente pois queremos tentar o git init com o que veio, mas avisamos.
} else {
    Write-Host "Copia concluida com sucesso."
}

# 3. Inicializar Git e configurar remoto
Set-Location $dest
Write-Host "Configurando Git em $dest..."

# Remove .git antigo se foi copiado por engano (mas excluímos no robocopy)
if (Test-Path ".git") {
    Remove-Item -Path ".git" -Recurse -Force
}

git init
git branch -M main
git remote add origin $remoteUrl

# 4. Commit e Push Force
Write-Host "Adicionando arquivos ao Git..."
git add .
git commit -m "Migracao forçada para novo ambiente local (C:\Dev)"

Write-Host "Realizando Push Force para $remoteUrl..."
git push -u origin main --force

Write-Host "Migracao finalizada!"
