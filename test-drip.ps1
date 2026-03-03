$url = "https://peqluzhrhgnwjhvxxtzs.supabase.co/functions/v1/send-drip-emails"
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcWx1emhyaGdud2podnh4dHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgxOTI4NiwiZXhwIjoyMDgzMzk1Mjg2fQ.YtHS_8US0TOhV0-s6Xvxe1D3p8UJUdcQ-u2bel03rKc"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

$response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers
Write-Host "Result: sent=$($response.sent) skipped=$($response.skipped)"
