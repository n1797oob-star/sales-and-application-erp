@echo off
title TMI Sales ^& Application Management ERP Launcher
echo ====================================================
echo     TMI Sales ^& Application Management ERP Launcher
echo ====================================================
echo.
echo Starting development server...
start /b cmd /c npm run dev
timeout /t 3 /nobreak >nul
echo Opening browser at http://localhost:3000 ...
start http://localhost:3000
echo.
echo Application started successfully!
pause
