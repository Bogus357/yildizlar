$dir = Join-Path $PSScriptRoot "..\assets\audio"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$tracks = @{
  "sky.mp3"     = "https://incompetech.com/music/royalty-free/mp3-royalty-free/District%20Four.mp3"
  "phone.mp3"   = "https://incompetech.com/music/royalty-free/mp3-royalty-free/Deliberate%20Thought.mp3"
  "concert.mp3" = "https://incompetech.com/music/royalty-free/mp3-royalty-free/All%20This%20-%20Scoring%20Action.mp3"
  "meyhane.mp3" = "https://incompetech.com/music/royalty-free/mp3-royalty-free/Eastern%20Thought.mp3"
  "finale.mp3"  = "https://incompetech.com/music/royalty-free/mp3-royalty-free/Dreamy%20Flashback.mp3"
}

foreach ($name in $tracks.Keys) {
  $out = Join-Path $dir $name
  if (Test-Path $out) {
    Write-Host "Atlandi (zaten var): $name"
    continue
  }
  try {
    Invoke-WebRequest -Uri $tracks[$name] -OutFile $out -TimeoutSec 120
    Write-Host "Indirildi: $name"
  } catch {
    Write-Host "Hata ($name): $_"
  }
}

Write-Host ""
Write-Host "MEY icin: Model - Mey sarkisini MP3 olarak assets/audio/mey.mp3 konumuna koy."
