param(
    [string]$FrontendUrl = "http://localhost:5173",
    [string]$BackendHealthUrl,
    [string]$SwaggerUrl,
    [string]$MailpitUrl = "http://localhost:8025"
)

$apiPort = if ($env:API_PORT) { $env:API_PORT } else { "8080" }
$resolvedBackendHealthUrl = if ($BackendHealthUrl) { $BackendHealthUrl } else { "http://localhost:$apiPort/actuator/health" }
$resolvedSwaggerUrl = if ($SwaggerUrl) { $SwaggerUrl } else { "http://localhost:$apiPort/swagger-ui/index.html" }

$targets = @(
    @{ Name = "frontend"; Url = $FrontendUrl },
    @{ Name = "backend-health"; Url = $resolvedBackendHealthUrl },
    @{ Name = "swagger"; Url = $resolvedSwaggerUrl },
    @{ Name = "mailpit"; Url = $MailpitUrl }
)

function Test-HttpTarget {
    param(
        [Parameter(Mandatory = $true)][string]$Url
    )

    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ($curl) {
        $tempFile = New-TemporaryFile
        try {
            $statusText = & curl.exe -L -s -o $tempFile.FullName -w "%{http_code}" --max-time 10 $Url
            if ($statusText -match '^\d+$') {
                return [int]$statusText
            }
        } finally {
            Remove-Item -LiteralPath $tempFile.FullName -Force -ErrorAction SilentlyContinue
        }
    }

    $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10 -UseBasicParsing
    return [int]$response.StatusCode
}

$results = foreach ($target in $targets) {
    try {
        $statusCode = Test-HttpTarget -Url $target.Url
        $isUp = $statusCode -ge 200 -and $statusCode -lt 400
        [pscustomobject]@{
            service = $target.Name
            url = $target.Url
            status = if ($isUp) { "UP" } else { "DOWN" }
            httpStatus = $statusCode
        }
    } catch {
        $statusCode = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        [pscustomobject]@{
            service = $target.Name
            url = $target.Url
            status = "DOWN"
            httpStatus = $statusCode
        }
    }
}

$results | Format-Table -AutoSize
