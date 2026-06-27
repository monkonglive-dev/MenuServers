@echo off
cd /d "%~dp0"

color 0F
title Monkongs SideLoader

reg add "HKCU\Console" /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1
for /f "delims=" %%E in ('echo prompt $E ^| cmd') do set "ESC=%%E"

echo.
echo %ESC%[91m----------------------------------%ESC%[0m
echo %ESC%[93mInstalling dependencies...%ESC%[0m
pip install frida frida-tools >nul 2>&1
echo %ESC%[92mReady%ESC%[0m
echo %ESC%[91m----------------------------------%ESC%[0m

setlocal enabledelayedexpansion
set "selected=1"

goto :selected_1

:menu
cls
call :showmenu
goto getkey

:showmenu
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$s = %selected%; " ^
 "$r = [char]27; " ^
 "Write-Host ''; " ^
 "Write-Host ('  {0}[90m+=========================================+{0}[0m' -f $r); " ^
 "Write-Host ('  {0}[90m#{0}[0m  {0}[91mM{0}[93mO{0}[92mN{0}[96mK{0}[94mO{0}[95mN{0}[91mG{0}[93mS{0}[0m  {0}[92mS{0}[96mI{0}[94mD{0}[95mE{0}[91mL{0}[93mO{0}[92mA{0}[96mD{0}[94mE{0}[95mR{0}[0m  {0}[90m#{0}[0m' -f $r); " ^
 "Write-Host ('  {0}[90m+=========================================+{0}[0m' -f $r); " ^
 "Write-Host ('  {0}[90m#{0}[0m                                         {0}[90m#{0}[0m' -f $r); " ^
 "$opts = @('1. Start M4Quest only','2. Start EAC Defuser only','3. Start Everything','4. PC Mode (EAC Defuse Always On)'); " ^
 "$colors = @('92','96','93','95'); " ^
 "for ($i=0; $i -lt 4; $i++) { " ^
 "  $c = $colors[$i]; " ^
 "  if (($i+1) -eq $s) { " ^
 "    Write-Host ('  {0}[90m#{0}[0m  {0}[97m^>{0}[0m {0}[{1}m{2}{0}[90m#{0}[0m' -f $r,$c,$opts[$i].PadRight(38)) " ^
 "  } else { " ^
 "    Write-Host ('  {0}[90m#{0}[0m    {0}[{1}m{2}{0}[90m#{0}[0m' -f $r,$c,$opts[$i].PadRight(38)) " ^
 "  } " ^
 "} " ^
 "Write-Host ('  {0}[90m#{0}[0m                                         {0}[90m#{0}[0m' -f $r); " ^
 "Write-Host ('  {0}[90m#{0}[0m  {0}[36mUp/Down Navigate  -  Enter Select    {0}[90m#{0}[0m' -f $r); " ^
 "Write-Host ('  {0}[90m+=========================================+{0}[0m' -f $r); " ^
 "Write-Host ''"

exit /b 0

:getkey
for /f "delims=" %%A in ('powershell -NoProfile -Command "$k = $host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown'); Write-Output $k.VirtualKeyCode"') do set "key=%%A"
if "!key!"=="38" (
    set /a selected-=1
    if !selected! lss 1 set "selected=4"
    goto menu
)
if "!key!"=="40" (
    set /a selected+=1
    if !selected! gtr 4 set "selected=1"
    goto menu
)
if "!key!"=="13" goto selected_!selected!
goto getkey

:selected_1
cls
echo.
echo  %ESC%[93mFetching scripts from server...%ESC%[0m
call :runInject quest
pause >nul
goto menu

:selected_2
cls
echo.
echo  %ESC%[93mFetching scripts from server...%ESC%[0m
call :runInject eac
pause >nul
goto menu

:selected_3
cls
echo.
echo  %ESC%[93mFetching scripts from server...%ESC%[0m
call :runInject all
pause >nul
goto menu

:selected_4
cls
echo.
echo  %ESC%[93mFetching scripts from server...%ESC%[0m
call :runInject pcmode
pause >nul
goto menu

:runInject
set "SCRIPTDIR=%TEMP%\monkong_scripts"
if exist "%SCRIPTDIR%" rmdir /s /q "%SCRIPTDIR%"
mkdir "%SCRIPTDIR%" >nul 2>&1

set "BASE=https://raw.githubusercontent.com/monkonglive-dev/MenuServers/main"
set "CB=%RANDOM%"
set "MODE=%~1"

echo  %ESC%[96mDownloading scripts...%ESC%[0m

REM Bridge FIRST
call :download "%BASE%/frida-il2cpp-bridge.js?v=%CB%" "%SCRIPTDIR%\01_bridge.js"
REM Symbols second
call :download "%BASE%/symbols.js?v=%CB%" "%SCRIPTDIR%\02_symbols.js"
REM EAC bypass third
call :download "%BASE%/Bypassed/eac.js?v=%CB%" "%SCRIPTDIR%\03_eac.js"

if "%MODE%"=="eac" goto :load_eac
if "%MODE%"=="pcmode" goto :load_pcmode
if "%MODE%"=="quest" goto :load_quest

REM all mode
call :download "%BASE%/Bypassed/stuff.js?v=%CB%" "%SCRIPTDIR%\04_stuff.js"
call :download "%BASE%/MonksMenu.js?v=%CB%" "%SCRIPTDIR%\05_menu.js"
call :download "%BASE%/m4quest.js?v=%CB%" "%SCRIPTDIR%\06_quest.js"
call :download "%BASE%/discordrpc.js?v=%CB%" "%SCRIPTDIR%\07_rpc.js"
goto :do_inject

:load_eac
call :download "%BASE%/Bypassed/stuff.js?v=%CB%" "%SCRIPTDIR%\04_stuff.js"
goto :do_inject

:load_pcmode
call :download "%BASE%/Bypassed/stuff.js?v=%CB%" "%SCRIPTDIR%\04_stuff.js"
call :download "%BASE%/pcmode.js?v=%CB%" "%SCRIPTDIR%\05_pcmode.js"
goto :do_inject

:load_quest
call :download "%BASE%/m4quest.js?v=%CB%" "%SCRIPTDIR%\04_quest.js"
goto :do_inject

:do_inject
echo.
echo  %ESC%[93mPress any key to attach to game...%ESC%[0m
pause >nul

echo  %ESC%[96mInjecting scripts...%ESC%[0m

REM Build frida command with all .js files in directory
set "FRIDA_ARGS="
for %%f in ("%SCRIPTDIR%\*.js") do (
    set "FRIDA_ARGS=!FRIDA_ARGS! -l "%%f""
)

frida -n "animalcompany.exe" --runtime=v8 !FRIDA_ARGS!

echo.
echo  %ESC%[93mCleaning up...%ESC%[0m
rmdir /s /q "%SCRIPTDIR%" >nul 2>&1
exit /b

:download
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -Uri '%~1' -UseBasicParsing -TimeoutSec 15; [IO.File]::WriteAllText('%~2', $r.Content) } catch { Write-Host '  [!] Failed: %~nx1' }"
if exist "%~2" (
    echo  %ESC%[92m[+] Downloaded: %~nx2%ESC%[0m
) else (
    echo  %ESC%[91m[!] Failed: %~nx2%ESC%[0m
)
exit /b
