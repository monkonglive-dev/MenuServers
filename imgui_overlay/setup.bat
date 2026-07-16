@echo off
echo ============================================
echo  Animal Company External Overlay - Setup
echo ============================================
echo.

if "%1"=="--dumper" (
    echo Building offset dumper...
    echo.
    echo Checking for frida...
    pip show frida >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo Installing frida...
        pip install frida frida-tools
    )
    echo.
    echo ========================================
    echo  INSTRUCTIONS:
    echo  1. Start the game on Quest or PC
    echo  2. Make sure frida-server is running
    echo  3. Run: py dumper\dumper.py
    echo ========================================
    echo.
    py dumper\dumper.py
    goto :end
)

echo Checking dependencies...
echo.

REM Check for frida
pip show frida >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] frida not found. Installing...
    pip install frida frida-tools
)

REM Check for Visual Studio Build Tools
where cl >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [+] MSVC found
    goto :build_msvc
)

REM Check for g++ (MinGW)
where g++ >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [+] MinGW found
    goto :build_mingw
)

REM Check for gcc
where gcc >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [+] GCC found
    goto :build_mingw
)

echo.
echo [!] No C++ compiler found.
echo.
echo Option 1: Install Visual Studio Build Tools (recommended)
echo   Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
echo   Select "Desktop development with C++"
echo.
echo Option 2: Install MinGW-w64
echo   Download: https://www.mingw-w64.org/
echo   Or: pacman -S mingw-w64-x86_64-gcc (MSYS2)
echo.
echo After installing, run setup.bat again.
echo.
goto :end

:build_msvc
echo.
echo Building with MSVC...
if not exist "build" mkdir build
cd build

REM Try cmake first
where cmake >nul 2>nul
if %ERRORLEVEL% equ 0 (
    cmake .. -G "Visual Studio 17 2022" -A x64 2>nul
    if %ERRORLEVEL% equ 0 (
        cmake --build . --config Release
        goto :done
    )
)

REM Fallback: direct cl.exe compilation
echo CMake not found, compiling directly with cl.exe...
cl /EHsc /std:c++17 /O2 /MT /Fe:overlay.exe ..\src\main.cpp /I..\include /I..\external\openvr\headers /I..\external\imgui /link /LIBPATH:..\lib openvr_api.lib d3d11.lib d3dcompiler.lib
goto :done

:build_mingw
echo.
echo Building with MinGW...
if not exist "build" mkdir build
cd build
g++ -std=c++17 -O2 -o overlay.exe ..\src\main.cpp -I..\include -I..\external\openvr\headers -I..\external\imgui -lvrapi -ld3d11 -ld3dcompiler -static
goto :done

:done
if exist "Release\overlay.exe" (
    echo.
    echo [+] Build successful!
    echo     Run: build\Release\overlay.exe
    echo.
) else if exist "overlay.exe" (
    echo.
    echo [+] Build successful!
    echo     Run: build\overlay.exe
    echo.
) else (
    echo.
    echo [-] Build failed. Check errors above.
)

:end
pause
