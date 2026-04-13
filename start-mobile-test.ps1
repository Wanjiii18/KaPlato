# Mobile Testing Script - Generates QR Code for Phone Testing
Write-Host "Starting KaPlato for Mobile Testing..." -ForegroundColor Cyan

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*"}).IPAddress
if (-not $localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}).IPAddress | Select-Object -First 1
}

$port = 8100
$url = "http://${localIP}:${port}"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   KaPlato Mobile Test Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nYour app will be available at:" -ForegroundColor Yellow
Write-Host "  $url" -ForegroundColor Cyan
Write-Host "`nScan this QR code with your phone:" -ForegroundColor Yellow
Write-Host "(Make sure your phone is on the same WiFi network)`n" -ForegroundColor Gray

# Generate QR code in terminal
if (Get-Command qrcode-terminal -ErrorAction SilentlyContinue) {
    npx qrcode-terminal $url
} else {
    Write-Host "QR Code Generator not found. Install it with:" -ForegroundColor Red
    Write-Host "  npm install -g qrcode-terminal`n" -ForegroundColor Yellow
    Write-Host "Or manually visit: $url on your phone" -ForegroundColor Cyan
}

Write-Host "`n========================================`n" -ForegroundColor Green

# Start Ionic serve with network access
ionic serve --host=0.0.0.0 --port=$port
