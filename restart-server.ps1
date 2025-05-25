# Script PowerShell pour redémarrer le serveur Next.js proprement
# Diagnostic et démarrage du serveur TETIKA

Write-Host "🚀 Redémarrage du serveur TETIKA..." -ForegroundColor Green
Write-Host ""

# Arrêter tous les processus Node.js
Write-Host "🛑 Arrêt des processus Node.js existants..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "✅ Processus Node.js arrêtés" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Aucun processus Node.js à arrêter" -ForegroundColor Cyan
}

# Nettoyer le cache Next.js
Write-Host ""
Write-Host "🧹 Nettoyage du cache Next.js..." -ForegroundColor Yellow
try {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "tsconfig.tsbuildinfo" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cache nettoyé" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Cache déjà propre" -ForegroundColor Cyan
}

# Vérifier les dépendances
Write-Host ""
Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules manquant, installation..." -ForegroundColor Red
    npm install
} else {
    Write-Host "✅ node_modules présent" -ForegroundColor Green
}

# Vérifier les fichiers critiques
Write-Host ""
Write-Host "🔍 Vérification des fichiers critiques..." -ForegroundColor Yellow
$criticalFiles = @(
    "app/api/scrape/route.ts",
    "components/chat/ChatInput.tsx", 
    "components/chat/ChatInterface.tsx",
    "package.json"
)

$allFilesPresent = $true
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MANQUANT" -ForegroundColor Red
        $allFilesPresent = $false
    }
}

if (-not $allFilesPresent) {
    Write-Host ""
    Write-Host "❌ Fichiers critiques manquants. Vérifiez votre workspace." -ForegroundColor Red
    exit 1
}

# Démarrer le serveur
Write-Host ""
Write-Host "🚀 Démarrage du serveur de développement..." -ForegroundColor Green
Write-Host "📍 URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Mode: Development avec Turbopack" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Pour tester le scraping:" -ForegroundColor Yellow
Write-Host "   node test-scraping-logic.js" -ForegroundColor White
Write-Host "   node diagnose-server.js" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Pour arrêter: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Démarrer avec gestion d'erreur
try {
    npm run dev
} catch {
    Write-Host "❌ Erreur lors du démarrage du serveur" -ForegroundColor Red
    Write-Host "🔧 Essayez manuellement: npm run dev" -ForegroundColor Yellow
}
