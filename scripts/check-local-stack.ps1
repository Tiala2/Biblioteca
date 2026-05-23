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

$results = foreach ($target in $targets) {
    try {
        $response = Invoke-WebRequest -Uri $target.Url -Method GET -TimeoutSec 10
        [pscustomobject]@{
            service = $target.Name
            url = $target.Url
            status = "UP"
            httpStatus = [int]$response.StatusCode
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
