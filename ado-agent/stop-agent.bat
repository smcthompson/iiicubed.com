@echo off
echo ========================================
echo Stopping Azure DevOps Linux Agent...
echo ========================================

cd /d "%~dp0.."

docker stop ado-agent

if %ERRORLEVEL% equ 0 (
    echo ✅ Agent stopped cleanly.
    echo    It should now appear as Disconnected in Azure DevOps.
) else (
    echo ℹ️ No running container named "ado-agent" was found.
)

cd /d "%~dp0"
@REM pause