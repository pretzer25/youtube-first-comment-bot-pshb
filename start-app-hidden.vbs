Dim WShell
Set WShell = CreateObject("WScript.Shell")
WShell.Run "npm run start", 0
Set WShell = Nothing