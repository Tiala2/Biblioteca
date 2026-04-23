param(
    [string]$FrontendUrl = "http://localhost:5173",
    [string]$BackendHealthUrl = "http://localhost:8080/actuator/health",
    [string]$SwaggerUrl = "http://localhost:8080/swagger-ui/index.html",
    [string]$MailpitUrl = "http://localhost:8025"
)

$targets = @(
    @{ Name = "frontend"; Url = $FrontendUrl },
    @{ Name = "backend-health"; Url = $BackendHealthUrl },
    @{ Name = "swagger"; Url = $SwaggerUrl },
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
