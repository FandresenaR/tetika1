# Test script PowerShell pour l'API de scraping
Write-Host "🧪 Test de l'API de Scraping" -ForegroundColor Cyan
Write-Host "=" * 50

# Données de test
$testData = @{
    query = "https://vivatechnology.com/partners"
    mode = "deep-scraping"
    maxSources = 5
    includeAnalysis = $true
} | ConvertTo-Json

Write-Host "📤 Données envoyées:" -ForegroundColor Yellow
Write-Host $testData

# URL de l'API (essayer différents ports)
$ports = @(3000, 3001, 3002, 3003)
$apiUrl = $null

foreach ($port in $ports) {
    $testUrl = "http://localhost:$port/api/scraping"
    try {
        Write-Host "🔍 Test du port $port..." -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $apiUrl = $testUrl
            Write-Host "✅ Serveur trouvé sur le port $port" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host "❌ Port $port non accessible" -ForegroundColor Red
    }
}

if (-not $apiUrl) {
    Write-Host "❌ Aucun serveur trouvé. Assurez-vous que 'npm run dev' est lancé." -ForegroundColor Red
    exit 1
}

# Test de l'API
try {
    Write-Host "🌐 Test de l'API sur $apiUrl..." -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri $apiUrl -Method POST -Body $testData -ContentType "application/json" -TimeoutSec 30
    
    Write-Host "📥 Status: $($response.StatusCode)" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "✅ Réponse reçue:" -ForegroundColor Green
    Write-Host "- Success: $($result.success)"
    Write-Host "- Steps: $($result.steps.Count)"
    Write-Host "- Companies: $($result.companies.Count)"
    Write-Host "- MCP Method: $($result.mcpMethod)"
    Write-Host "- Total Found: $($result.totalFound)"
    
    if ($result.companies -and $result.companies.Count -gt 0) {
        Write-Host "🏢 Entreprises trouvées:" -ForegroundColor Yellow
        for ($i = 0; $i -lt [Math]::Min(3, $result.companies.Count); $i++) {
            $company = $result.companies[$i]
            Write-Host "  - $($company.name) | $($company.website)"
        }
    }
    
    Write-Host "🎉 Test réussi!" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur lors du test:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorText = $reader.ReadToEnd()
        Write-Host "📄 Détails de l'erreur: $errorText" -ForegroundColor Red
    }
}
