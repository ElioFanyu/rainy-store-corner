@echo off
rem 雨夜便利店 - 停止后台本地服务
chcp 65001 >nul
setlocal
set "PIDFILE=%TEMP%\RainyStoreCorner\server.pid"

if not exist "%PIDFILE%" (
  echo 没有正在运行的本地服务。
  goto done
)

set /p SERVERPID=<"%PIDFILE%"
if not defined SERVERPID goto done

taskkill /PID %SERVERPID% /T /F >nul 2>&1
echo 本地服务已停止。
del "%PIDFILE%" >nul 2>&1

:done
ping -n 3 127.0.0.1 >nul 2>&1
