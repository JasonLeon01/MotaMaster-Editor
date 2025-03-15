@echo off
start cmd /k "cd /d %~dp0 && npm start"

:: 等待 React 开发服务器启动
:wait_for_server
timeout /t 2 /nobreak > nul
curl -s http://localhost:3000 > nul
if %errorlevel% neq 0 goto wait_for_server

:: 启动 Electron
start cmd /k "cd /d %~dp0 && npm run electron"