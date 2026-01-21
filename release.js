import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const webPackagePath = path.join(__dirname, 'web', 'package.json');
const workerPackagePath = path.join(__dirname, 'worker', 'package.json');
const versionFilePath = path.join(__dirname, 'web', 'src', 'version.js');

// 1. Ler o package.json (Web como referência principal)
if (!fs.existsSync(webPackagePath)) {
    console.error('❌ Erro: web/package.json não encontrado.');
    process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(webPackagePath, 'utf8'));
const currentVersion = packageJson.version;

// 2. Incrementar a versão (Patch)
let versionParts = currentVersion.split('.').map(Number);
versionParts[2] += 1;
const newVersion = versionParts.join('.');

console.log(`🆙 Atualizando versão: ${currentVersion} -> ${newVersion}`);

// 3. Atualizar web/package.json
packageJson.version = newVersion;
fs.writeFileSync(webPackagePath, JSON.stringify(packageJson, null, 2));

// 4. Atualizar worker/package.json (se existir)
if (fs.existsSync(workerPackagePath)) {
    const workerPkg = JSON.parse(fs.readFileSync(workerPackagePath, 'utf8'));
    workerPkg.version = newVersion;
    fs.writeFileSync(workerPackagePath, JSON.stringify(workerPkg, null, 2));
    console.log('✅ worker/package.json atualizado.');
}

// 5. Gerar web/src/version.js
const versionFileContent = `export const appVersion = "${newVersion}";\n`;
fs.writeFileSync(versionFilePath, versionFileContent);
console.log('✅ web/src/version.js gerado.');

// 6. Git commands
try {
    console.log('📦 Git Add...');
    execSync('git add .');

    console.log('🔖 Git Commit...');
    execSync(`git commit -m "chore(release): v${newVersion}"`);

    console.log('🚀 Git Push...');
    execSync('git push');

    console.log(`🎉 Release v${newVersion} concluído!`);
} catch (error) {
    console.error('❌ Erro no Git:', error.message);
}