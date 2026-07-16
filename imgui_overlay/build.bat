@echo off
echo ============================================
echo  Animal Company External Overlay - Build
echo ============================================
echo.

set SCRIPT_DIR=%~dp0
set IMGUI_DIR=%SCRIPT_DIR%imgui
set OPENVR_DIR=%SCRIPT_DIR%openvr
set SRC_DIR=%SCRIPT_DIR%src
set INC_DIR=%SCRIPT_DIR%include
set OUT_DIR=%SCRIPT_DIR%build
set OUT_EXE=%OUT_DIR%\syte.xyz.exe

if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

echo [*] Compiling overlay.exe...
echo.

windres "%SCRIPT_DIR%resources.rc" -O coff -o "%OUT_DIR%\resources.o"
if errorlevel 1 (
    echo [-] Embedded backend resource build failed!
    pause
    exit /b 1
)

g++ -std=c++17 -O3 -flto -fvisibility=hidden -fno-ident -ffunction-sections -fdata-sections -s -static -Wl,--dynamicbase -Wl,--nxcompat -Wl,--gc-sections -Wall -Wno-unused-function -Wno-missing-field-initializers -Wno-stringop-overread -o "%OUT_EXE%" ^
    "%SRC_DIR%/main.cpp" ^
    "%OUT_DIR%/resources.o" ^
    "%IMGUI_DIR%/imgui.cpp" ^
    "%IMGUI_DIR%/imgui_draw.cpp" ^
    "%IMGUI_DIR%/imgui_tables.cpp" ^
    "%IMGUI_DIR%/imgui_widgets.cpp" ^
    "%IMGUI_DIR%/backends/imgui_impl_win32.cpp" ^
    "%IMGUI_DIR%/backends/imgui_impl_dx11.cpp" ^
    -I"%INC_DIR%" ^
    -I"%IMGUI_DIR%" ^
    -I"%IMGUI_DIR%/backends" ^
    -I"%OPENVR_DIR%/headers" ^
    -L"%OPENVR_DIR%/lib" ^
    -lopenvr_api -ld3d11 -ld3dcompiler -ldwmapi -lwinhttp -ladvapi32 -lwinmm -lshell32 -lcomdlg32 -lole32 -loleaut32 -luuid -lgdi32 -luser32 -limm32 -lversion

if errorlevel 1 (
    echo [-] overlay.exe build failed!
    pause
    exit /b 1
)
echo [+] overlay.exe OK
strip --strip-all "%OUT_EXE%" >nul 2>nul

echo.
echo [+] Build complete!
echo [+] syte.xyz.exe  - Run this (SteamVR overlay)
echo.

copy /Y "%OPENVR_DIR%\lib\openvr_api.dll" "%OUT_DIR%\openvr_api.dll" >nul 2>nul
del /Q "%OUT_DIR%\backend.js" "%OUT_DIR%\ac_bridge.js" "%OUT_DIR%\combined.js" ^
    "%OUT_DIR%\item_ids.txt" "%OUT_DIR%\startbackend.bat" "%OUT_DIR%\resources.o" ^
    "%OUT_DIR%\overlay.exe" >nul 2>nul

pause
