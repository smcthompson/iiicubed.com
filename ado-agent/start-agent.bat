@echo off
echo ========================================
echo Starting Azure DevOps Linux Agent...
echo ========================================

cd /d "%~dp0.."

:: Check if .env exists
if not exist .env (
    echo ERROR: .env file not found in project root!
    @REM pause
    exit /b 1
)

:: Load variables from .env
for /f "usebackq tokens=*" %%a in (".env") do (
    set "%%a"
) 2>nul

if "%AZP_URL%"=="" (
    echo ERROR: AZP_URL is not set in .env
    @REM pause
    exit /b 1
)
if "%AZP_TOKEN%"=="" (
    echo ERROR: AZP_TOKEN is not set in .env
    @REM pause
    exit /b 1
)

set AZP_POOL=%AZP_POOL: =%
set AZP_AGENT_NAME=%AZP_AGENT_NAME: =%

:: Stop and remove any existing container
docker stop ado-agent 2>nul
docker rm ado-agent 2>nul

echo Starting container...
docker run -d --name ado-agent ^
  --env-file .env ^
  --restart unless-stopped ^
  ado-linux-agent

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Agent started successfully!
    echo    Agent Name : %AZP_AGENT_NAME%
    echo    Pool       : %AZP_POOL%
    echo    Environment: %NODE_ENV%
    echo.
    echo Use: docker logs -f ado-agent
) else (
    echo.
    echo ❌ Failed to start the agent.
)

cd /d "%~dp0"
@REM pause