@echo off
echo ========================================
echo Restarting Azure DevOps Linux Agent...
echo ========================================

cd /d "%~dp0"

call stop-agent.bat
echo.
call start-agent.bat