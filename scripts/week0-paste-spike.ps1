param(
  [string]$Text = "PromptBridge paste spike: keep `useEffect`, npm run build, and C:\repo\app.tsx unchanged."
)

Add-Type -AssemblyName System.Windows.Forms

$previousClipboard = ""
try {
  $previousClipboard = Get-Clipboard -Raw
} catch {
  $previousClipboard = ""
}

$notepad = Start-Process -FilePath notepad.exe -PassThru
Start-Sleep -Milliseconds 700

[System.Windows.Forms.SendKeys]::SendWait($Text)
Start-Sleep -Milliseconds 250

Set-Clipboard -Value $Text
[System.Windows.Forms.SendKeys]::SendWait("^v")
Start-Sleep -Milliseconds 250
Set-Clipboard -Value $previousClipboard

Write-Host "Opened Notepad and tested direct SendKeys plus clipboard paste."
Write-Host "Expected: the test sentence appears twice, and your previous clipboard text is restored."
Write-Host "Close the Notepad window without saving after visual confirmation."
