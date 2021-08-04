Dim WShell
Set WShell = CreateObject("WScript.Shell")
WShell.Run "npm run test", 0
Set WShell = Nothing