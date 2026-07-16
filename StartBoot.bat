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
 "$opts = @('1. EAC Defuser','2. M4Quest (with EAC)','3. Start Everything','4. Menu Only'); " ^
 "$colors = @('96','92','93','95'); " ^
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
goto do_download_eac

:selected_2
cls
echo.
echo  %ESC%[93mFetching scripts from server...%ESC%[0m
goto do_download_quest

:selected_3
cls
echo.
echo  %ESC%[93mFetching scripts from server...%ESC%[0m
goto do_download_all

:selected_4
cls
echo.
echo  %ESC%[93mFetching scripts from server...%ESC%[0m
goto do_download_menu

:do_download_eac
set "SCRIPTDIR=%TEMP%\monkong_scripts"
set "BASE=https://raw.githubusercontent.com/monkonglive-dev/MenuServers/main"
set "CB=%RANDOM%"
set "MODE=eac"
if exist "%SCRIPTDIR%" rmdir /s /q "%SCRIPTDIR%"
mkdir "%SCRIPTDIR%" >nul 2>&1
echo  %ESC%[96mDownloading scripts...%ESC%[0m
powershell -NoProfile -ExecutionPolicy Bypass -Command "$base='%BASE%'; $d='%SCRIPTDIR%'; $v='%CB%'; $files=@(@('01_bridge.js','frida-il2cpp-bridge.js'),('02_symbols.js','symbols.js'),('03_eac.js','Bypassed/eac.js'),('04_stuff.js','Bypassed/stuff.js')); foreach($f in $files){try{$r=Invoke-WebRequest -Uri \"$base/$($f[1])?v=$v\" -UseBasicParsing -TimeoutSec 15;[IO.File]::WriteAllText(\"$d\$($f[0])\",$r.Content);Write-Host \"  [+] Downloaded: $($f[0])\"}catch{Write-Host \"  [!] Failed: $($f[0])\"}}"
goto do_inject

:do_download_quest
set "SCRIPTDIR=%TEMP%\monkong_scripts"
set "BASE=https://raw.githubusercontent.com/monkonglive-dev/MenuServers/main"
set "CB=%RANDOM%"
set "MODE=quest"
if exist "%SCRIPTDIR%" rmdir /s /q "%SCRIPTDIR%"
mkdir "%SCRIPTDIR%" >nul 2>&1
echo  %ESC%[96mDownloading scripts...%ESC%[0m
powershell -NoProfile -ExecutionPolicy Bypass -Command "$base='%BASE%'; $d='%SCRIPTDIR%'; $v='%CB%'; $files=@(@('01_bridge.js','frida-il2cpp-bridge.js'),('02_symbols.js','symbols.js'),('03_eac.js','Bypassed/eac.js'),('04_stuff.js','Bypassed/stuff.js'),('05_quest.js','m4quest.js')); foreach($f in $files){try{$r=Invoke-WebRequest -Uri \"$base/$($f[1])?v=$v\" -UseBasicParsing -TimeoutSec 15;[IO.File]::WriteAllText(\"$d\$($f[0])\",$r.Content);Write-Host \"  [+] Downloaded: $($f[0])\"}catch{Write-Host \"  [!] Failed: $($f[0])\"}}"
goto do_inject

:do_download_all
set "SCRIPTDIR=%TEMP%\monkong_scripts"
set "BASE=https://raw.githubusercontent.com/monkonglive-dev/MenuServers/main"
set "CB=%RANDOM%"
set "MODE=all"
if exist "%SCRIPTDIR%" rmdir /s /q "%SCRIPTDIR%"
mkdir "%SCRIPTDIR%" >nul 2>&1
echo  %ESC%[96mDownloading scripts...%ESC%[0m
powershell -NoProfile -ExecutionPolicy Bypass -Command "$base='%BASE%'; $d='%SCRIPTDIR%'; $v='%CB%'; $files=@(@('01_bridge.js','frida-il2cpp-bridge.js'),('02_symbols.js','symbols.js'),('03_eac.js','Bypassed/eac.js'),('04_stuff.js','Bypassed/stuff.js'),('05_menu.js','MonksMenu.js'),('06_quest.js','m4quest.js'),('07_rpc.js','discordrpc.js')); foreach($f in $files){try{$r=Invoke-WebRequest -Uri \"$base/$($f[1])?v=$v\" -UseBasicParsing -TimeoutSec 15;[IO.File]::WriteAllText(\"$d\$($f[0])\",$r.Content);Write-Host \"  [+] Downloaded: $($f[0])\"}catch{Write-Host \"  [!] Failed: $($f[0])\"}}"
goto do_inject

:do_download_menu
set "SCRIPTDIR=%TEMP%\monkong_scripts"
set "BASE=https://raw.githubusercontent.com/monkonglive-dev/MenuServers/main"
set "CB=%RANDOM%"
set "MODE=menu"
if exist "%SCRIPTDIR%" rmdir /s /q "%SCRIPTDIR%"
mkdir "%SCRIPTDIR%" >nul 2>&1
echo  %ESC%[96mDownloading scripts...%ESC%[0m
powershell -NoProfile -ExecutionPolicy Bypass -Command "$base='%BASE%'; $d='%SCRIPTDIR%'; $v='%CB%'; $files=@(@('01_bridge.js','frida-il2cpp-bridge.js'),('02_symbols.js','symbols.js'),('03_menu.js','MonksMenu.js')); foreach($f in $files){try{$r=Invoke-WebRequest -Uri \"$base/$($f[1])?v=$v\" -UseBasicParsing -TimeoutSec 15;[IO.File]::WriteAllText(\"$d\$($f[0])\",$r.Content);Write-Host \"  [+] Downloaded: $($f[0])\"}catch{Write-Host \"  [!] Failed: $($f[0])\"}}"
goto do_inject

:do_inject
echo.

set "FRIDA_ARGS="
for %%f in ("%SCRIPTDIR%\*.js") do (
    set "FRIDA_ARGS=!FRIDA_ARGS! -l "%%f""
)

if "!MODE!"=="menu" (
    echo  %ESC%[93mLoad into the game, then press M to inject menu...%ESC%[0m
    :wait_m_menu
    for /f "delims=" %%A in ('powershell -NoProfile -Command "$k = $host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown'); Write-Output $k.VirtualKeyCode"') do set "key=%%A"
    if not "!key!"=="77" goto wait_m_menu
    echo  %ESC%[96mInjecting menu scripts...%ESC%[0m
    frida -n "animalcompany.exe" --runtime=v8 !FRIDA_ARGS!
    echo  %ESC%[92mSuccessfully sideloaded Menu!%ESC%[0m
) else (
    echo  %ESC%[93mStarting Frida bypass window...%ESC%[0m
    echo  %ESC%[96mStart Animal Company now. Frida will auto-inject when detected.%ESC%[0m
    echo.
    start "Monkongs Bypass" cmd /k frida -n animalcompany.exe --runtime=v8 !FRIDA_ARGS!
    echo  %ESC%[92mFrida bypass window opened!%ESC%[0m
)

echo.
echo  %ESC%[93mCleaning up after you close the bypass window...%ESC%[0m
pause >nul
rmdir /s /q "%SCRIPTDIR%" >nul 2>&1
goto menu
