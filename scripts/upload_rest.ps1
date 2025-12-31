$ErrorActionPreference = "Continue"

try {
    $dataPath = "$PSScriptRoot\sst_data.json"

    if (-not (Test-Path $dataPath)) {
        Write-Host "ERROR: Data file not found at $dataPath"
        exit 1
    }

    $jsonData = Get-Content -Path $dataPath -Raw | ConvertFrom-Json
    $total = $jsonData.Count
    Write-Host "Data Count: $total"

    $projectId = "aim-83922"
    $collection = "questions"
    $url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/$collection"

    # No auth header - relying on open rules
    $headers = @{
        "Content-Type" = "application/json"
    }

    Write-Host "Testing first document upload (no auth)..."
    $firstItem = $jsonData[0]
    $firstBody = $firstItem | ConvertTo-Json -Depth 10 -Compress

    try {
        $null = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $firstBody
        Write-Host "SUCCESS! First document uploaded. Continuing with rest..."
    }
    catch {
        Write-Host "First upload failed. Rules may not be open."
        Write-Host "Error: $_"
        exit 1
    }

    Write-Host "Starting full upload..."

    $count = 1  # Already uploaded first
    $errors = 0
    for ($i = 1; $i -lt $total; $i++) {
        $item = $jsonData[$i]
        $body = $item | ConvertTo-Json -Depth 10 -Compress

        try {
            $null = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $body
            $count++
            if ($count % 100 -eq 0) { Write-Host "Uploaded $count / $total" }
        }
        catch {
            $errors++
            if ($errors -ge 5) {
                Write-Host "Too many errors ($errors). Stopping."
                break
            }
        }
    }

    Write-Host "Upload Complete. Success: $count / $total (Errors: $errors)"
}
catch {
    Write-Host "Fatal Error: $_"
    exit 1
}
