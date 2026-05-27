$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$htmlFiles = Get-ChildItem -Path $root -Filter *.html -File
$version = Get-Date -Format "yyyyMMddHHmmss"
$utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($file in $htmlFiles) {
  $content = [System.IO.File]::ReadAllText($file.FullName)

  $content = [System.Text.RegularExpressions.Regex]::Replace(
    $content,
    'href="style\.css(?:\?v=[^"]*)?"',
    "href=""style.css?v=$version"""
  )

  $content = [System.Text.RegularExpressions.Regex]::Replace(
    $content,
    'src="script\.js(?:\?v=[^"]*)?"',
    "src=""script.js?v=$version"""
  )

  [System.IO.File]::WriteAllText($file.FullName, $content, $utf8)
}

Write-Output "Updated asset versions to $version in $($htmlFiles.Count) HTML files."
