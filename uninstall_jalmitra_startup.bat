@echo off
setlocal
set "TARGET=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\JalMitra.bat"
if exist "%TARGET%" (
  del "%TARGET%"
  echo Removed Windows startup shortcut.
) else (
  echo Nothing to remove — JalMitra.bat was not in Startup.
)
pause
