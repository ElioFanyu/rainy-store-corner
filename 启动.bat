@echo off
rem 雨夜便利店 - 桌面启动（无控制台窗口）
if exist "%~dp0launcher.vbs" (
  start "" wscript.exe "%~dp0launcher.vbs"
) else (
  cd /d "%~dp0"
  start "" http://127.0.0.1:4321/
  node server.mjs
)
