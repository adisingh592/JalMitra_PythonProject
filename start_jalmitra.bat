@echo off
echo ==========================================
echo Starting Jal Mitra Application...
echo ==========================================

echo Starting FastAPI Backend Server...
cd /d "e:\jlmiotra\backend"
start "Jal Mitra Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo Starting Vite Frontend Server...
cd /d "e:\jlmiotra\frontend"
start "Jal Mitra Frontend" cmd /k "pnpm run dev"

echo ==========================================
echo Jal Mitra servers have been launched!
echo Backend is running on http://127.0.0.1:8000
echo Frontend is running in your browser.
echo ==========================================
