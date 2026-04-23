@echo off
chcp 65001 >nul
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
