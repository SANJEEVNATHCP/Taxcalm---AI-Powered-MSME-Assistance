'' TaxClam - Silent Server Launcher
'' Starts the unified server without showing any console windows
'' and automatically opens the web interface

Set objShell = CreateObject("WScript.Shell")
Set objFS = CreateObject("Scripting.FileSystemObject")
strWorkDir = objFS.GetParentFolderName(WScript.ScriptFullName)

'' Change to workspace directory
objShell.CurrentDirectory = strWorkDir

'' Start the unified server silently in the background
'' Using pythonw.exe and vbHide (0) for no window
strCommand = """" & strWorkDir & "\.venv\Scripts\pythonw.exe"" """ & strWorkDir & "\unified_server.py"""
objShell.Run strCommand, 0, False

'' Wait 3 seconds for server to initialize
WScript.Sleep 3000

'' Open the web browser to TaxClam
objShell.Run "http://localhost:8000"

'' Exit silently
WScript.Quit
