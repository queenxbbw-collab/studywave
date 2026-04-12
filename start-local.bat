@echo off
echo ========================================
echo  StudyWave - Local Startup
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
  echo ERROR: .env file not found!
  echo Copy .env.example to .env and fill in your database details.
  echo.
  pause
  exit /b 1
)

REM Install dependencies
echo Installing dependencies...
call pnpm install
if %errorlevel% neq 0 (
  echo ERROR: pnpm install failed. Make sure pnpm is installed: npm install -g pnpm
  pause
  exit /b 1
)

REM Push database schema
echo.
echo Setting up database...
cd lib\db && call npm run push-force
cd ..\..

REM Build frontend
echo.
echo Building frontend...
set BASE_PATH=/
set NODE_ENV=production
call pnpm --filter @workspace/studywave run build

REM Build API server
echo.
echo Building API server...
call pnpm --filter @workspace/api-server run build

REM Start
echo.
echo ========================================
echo  Starting StudyWave on http://localhost:3000
echo ========================================
echo.
set NODE_ENV=production
call pnpm --filter @workspace/api-server run start
