Dim WShell
Set WShell = CreateObject("WScript.Shell")
WShell.Run "npm run test > ./output.log", 0
Set WShell = Nothing