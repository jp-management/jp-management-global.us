# PowerShell script to add aria-label to video elements
# English: aria-label="Promotional video"
# Spanish: aria-label="Video promocional"
# Skips commented-out video tags and tags that already have aria-label

$basePath = "C:\Users\Paul\Downloads\public_html"

# --- ENGLISH FILES ---
$enFiles = Get-ChildItem -Path $basePath -Filter "*.html" -File
$enCount = 0
foreach ($file in $enFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content
    $lines = $content -split "`n"
    $result = @()
    foreach ($line in $lines) {
        if ($line -match '<!--' -or $line -match 'aria-label') {
            $result += $line
        } elseif ($line -match '<video\s') {
            $result += ($line -replace '<video\s', '<video aria-label="Promotional video" ')
            $enCount++
        } elseif ($line -match '<video\s*$') {
            $result += ($line -replace '<video', '<video aria-label="Promotional video"')
            $enCount++
        } else {
            $result += $line
        }
    }
    $newContent = $result -join "`n"
    if ($newContent -ne $original) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "English: $enCount video tags updated"
Write-Host ""

# --- SPANISH FILES ---
$esFiles = Get-ChildItem -Path (Join-Path $basePath "es") -Filter "*.html" -File
$esCount = 0
foreach ($file in $esFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content
    $lines = $content -split "`n"
    $result = @()
    foreach ($line in $lines) {
        if ($line -match '<!--' -or $line -match 'aria-label') {
            $result += $line
        } elseif ($line -match '<video\s') {
            $result += ($line -replace '<video\s', '<video aria-label="Video promocional" ')
            $esCount++
        } elseif ($line -match '<video\s*$') {
            $result += ($line -replace '<video', '<video aria-label="Video promocional"')
            $esCount++
        } else {
            $result += $line
        }
    }
    $newContent = $result -join "`n"
    if ($newContent -ne $original) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline -Encoding UTF8
        Write-Host "Updated: es/$($file.Name)"
    }
}
Write-Host "Spanish: $esCount video tags updated"
Write-Host ""
Write-Host "Total: $($enCount + $esCount) video tags updated"