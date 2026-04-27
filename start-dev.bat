@echo off
setlocal

cd /d "%~dp0"

start "Backend" cmd /k "cd /d backend && python -m uvicorn app.main:app --reload --port 8000 --env-file ..\.env"
start "Frontend" cmd /k "npm run dev"
