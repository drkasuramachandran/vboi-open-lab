@echo off
title VBOI Open Lab

cd /d "C:\Users\ramac\Desktop\vboi-open-lab-vite-beautiful-ui\frontend"

echo ==========================================
echo   VIRTUAL BIOMEDICAL OPTICAL INSTRUMENTS
echo ==========================================
echo.
echo Starting server...
echo.

start "" http://localhost:5173/

npm run dev

pause