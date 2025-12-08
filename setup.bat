@echo off
REM ╔═══════════════════════════════════════════════════════════════╗
REM ║   Place Recommender Agent - Setup & Deployment (Windows)      ║
REM ║   TownX Project - Complete Implementation                     ║
REM ╚═══════════════════════════════════════════════════════════════╝

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║   Place Recommender Agent - Setup Script (Windows)            ║
echo ║   TownX Project - Complete Implementation                     ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js installation
echo Checking prerequisites...
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] Node.js is not installed
    echo Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [OK] Node.js installed: !NODE_VERSION!
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] npm is not installed
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo [OK] npm installed: !NPM_VERSION!
)

echo.
echo ═════════════════════════════════════════════════════════════════
echo Step 1: Backend Setup
echo ═════════════════════════════════════════════════════════════════
echo.

if exist "backend" (
    echo [OK] Backend directory found
    
    REM Check if .env exists
    if exist "backend\.env" (
        echo [!] .env file already exists
        set /p UPDATE_ENV="Do you want to update GROQ_API_KEY? (y/n) "
        if /i "!UPDATE_ENV!"=="y" (
            set /p GROQ_KEY="Enter your Groq API key: "
            (
                for /f "delims=" %%i in (backend\.env) do (
                    if not "%%i"=="" (
                        echo %%i | findstr /i "^GROQ_API_KEY=" >nul
                        if !errorlevel! neq 0 (
                            echo %%i
                        )
                    )
                )
                echo GROQ_API_KEY=!GROQ_KEY!
            ) > backend\.env.tmp
            move /y backend\.env.tmp backend\.env >nul
            echo [OK] GROQ_API_KEY updated
        )
    ) else (
        echo [!] .env file not found
        set /p GROQ_KEY="Enter your Groq API key: "
        (
            echo GROQ_API_KEY=!GROQ_KEY!
        ) > backend\.env
        echo [OK] .env file created
    )
    
    echo.
    echo Installing backend dependencies...
    cd backend
    call npm install >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Backend dependencies installed
    ) else (
        echo [X] Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [X] Backend directory not found
    pause
    exit /b 1
)

echo.
echo ═════════════════════════════════════════════════════════════════
echo Step 2: Frontend Setup
echo ═════════════════════════════════════════════════════════════════
echo.

if exist "frontend" (
    echo [OK] Frontend directory found
    
    echo.
    echo Installing frontend dependencies...
    cd frontend
    call npm install >nul 2>&1
    if !errorlevel! equ 0 (
        echo [OK] Frontend dependencies installed
    ) else (
        echo [X] Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [X] Frontend directory not found
    pause
    exit /b 1
)

echo.
echo ═════════════════════════════════════════════════════════════════
echo Step 3: Verification
echo ═════════════════════════════════════════════════════════════════
echo.

REM Check created files
if exist "backend\src\openstreetmap\agent-commonjs.js" (
    echo [OK] File exists: backend\src\openstreetmap\agent-commonjs.js
) else (
    echo [X] File missing: backend\src\openstreetmap\agent-commonjs.js
)

if exist "frontend\src\components\MapModal.jsx" (
    echo [OK] File exists: frontend\src\components\MapModal.jsx
) else (
    echo [X] File missing: frontend\src\components\MapModal.jsx
)

if exist "frontend\pages\RecommenderPage.jsx" (
    echo [OK] File exists: frontend\pages\RecommenderPage.jsx
) else (
    echo [X] File missing: frontend\pages\RecommenderPage.jsx
)

echo.
echo ═════════════════════════════════════════════════════════════════
echo [OK] Setup Complete!
echo ═════════════════════════════════════════════════════════════════
echo.
echo Next steps:
echo.
echo 1. Start the backend server (in Command Prompt 1):
echo    cd backend ^&^& npm run dev
echo.
echo 2. Start the frontend server (in Command Prompt 2):
echo    cd frontend ^&^& npm run dev
echo.
echo 3. Open your browser and navigate to:
echo    http://localhost:5173/recommender
echo.
echo 4. Try a test query:
echo    "Find cafes nearby"
echo.
echo ═════════════════════════════════════════════════════════════════
echo Documentation:
echo ═════════════════════════════════════════════════════════════════
echo.
echo - Read AGENT_QUICKSTART.md for quick start guide
echo - Read AGENT_SYSTEM_README.md for detailed documentation
echo - Read API_REFERENCE_TROUBLESHOOTING.md for API ^& debugging
echo - Read ARCHITECTURE.md for system architecture
echo.
echo ═════════════════════════════════════════════════════════════════
echo Status: [OK] READY FOR TESTING
echo ═════════════════════════════════════════════════════════════════
echo.
pause
