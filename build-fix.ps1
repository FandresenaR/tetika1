# Script to fix build permissions and run the Next.js build
Write-Host "Checking and fixing Next.js build permissions..." -ForegroundColor Yellow

# Path to the project
$projectPath = "C:\Users\Njato\Documents\Projets\tetika1"

# Check if .next directory exists and remove it
if (Test-Path "$projectPath\.next") {
    Write-Host "Removing existing .next directory..." -ForegroundColor Yellow
    try {
        Remove-Item -Recurse -Force -Path "$projectPath\.next" -ErrorAction Stop
        Write-Host "Successfully removed .next directory!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to remove .next directory. Details: $_" -ForegroundColor Red
        Write-Host "Will attempt to continue anyway..." -ForegroundColor Yellow
    }
}

# Create the .next directory with explicit permissions
Write-Host "Creating fresh .next directory with correct permissions..." -ForegroundColor Yellow
try {
    New-Item -Path "$projectPath\.next" -ItemType Directory -Force | Out-Null
    # Get current user
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    # Set explicit permissions
    $acl = Get-Acl -Path "$projectPath\.next"
    $permission = $currentUser, "FullControl", "Allow"
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
    $acl.SetAccessRule($accessRule)
    Set-Acl -Path "$projectPath\.next" -AclObject $acl
    Write-Host "Permissions set successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to set permissions. Details: $_" -ForegroundColor Red
}

# Run the build command
Write-Host "Running Next.js build..." -ForegroundColor Yellow
Set-Location -Path $projectPath
npm run build

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
