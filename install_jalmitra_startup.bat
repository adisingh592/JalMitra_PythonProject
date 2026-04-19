@echo off
setlocal
rem Copy launcher into Windows Startup folder so Jal Mitra starts when you log in

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "TARGET=%STARTUP%\JalMitra.bat"
set "SOURCE=%~dp0start_jalmitra.bat"

if not exist "%SOURCE%" (
  echo ERROR: Cannot find start_jalmitra.bat next to this script.
  pause
  exit /b 1
)

copy /Y "%SOURCE%" "%TARGET%" >nul
if %ERRORLEVEL% neq 0 (
  echo ERROR: Could not copy to Startup folder.
  pause
  exit /b 1
)

echo Installed: "%TARGET%"
echo Jal Mitra will run automatically each time you sign in to Windows.
echo To remove: run uninstall_jalmitra_startup.bat
pause
