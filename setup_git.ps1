$dest = "C:\Dev\ANTIGRAVITY\disparador"
$remoteUrl = "https://github.com/gberbert/disparador.git"

Set-Location $dest

# Verifica se tem arquivos essenciais (ex: package.json) antes de prosseguir
if (!(Test-Path "package.json")) {
    Write-Warning "AVISO: package.json nao encontrado em $dest."
    Write-Warning "Certifique-se de ter copiado os arquivos do projeto para esta pasta antes de rodar este script."
    $confirmation = Read-Host "Deseja continuar mesmo assim? (S/N)"
    if ($confirmation -ne "S") {
        exit
    }
}

Write-Host "Configurando Git em $dest..."

# Remove .git antigo se existir
if (Test-Path ".git") {
    Remove-Item -Path ".git" -Recurse -Force
}

git init
git branch -M main
git remote add origin $remoteUrl

# Ignorar arquivos de sistema/IDE comuns se nao tiver .gitignore
if (!(Test-Path ".gitignore")) {
    Write-Host "Criando .gitignore basico..."
    "node_modules/`n.env`n.DS_Store`ndist/`ncoverage/" | Out-File ".gitignore" -Encoding utf8
}

Write-Host "Adicionando arquivos ao Git..."
git add .
git commit -m "Migracao forçada para novo ambiente local"

Write-Host "Realizando Push Force para $remoteUrl..."
git push -u origin main --force

Write-Host "Setup do Git finalizado com sucesso!"
