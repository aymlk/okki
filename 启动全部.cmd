@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install the project-compatible Node.js before running.
  pause
  exit /b 1
)
node.exe "%~dp0scripts\start-projects.mjs" %*
pause
