@echo off
cd /d "%~dp0"

color 0F
title Monkongs SideLoader

reg add "HKCU\Console" /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1
for /f "delims=" %%E in ('echo prompt $E ^| cmd') do set "ESC=%%E"

echo Setting up paths...
set "PATH=%PATH%;%APPDATA%\Python\Python312\Scripts"
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Python\Python313\Scripts"
set "PATH=%PATH%;C:\Users\%USERNAME%\AppData\Local\Python\pythoncore-3.14-64\Scripts"
set "PATH=%PATH%;%LOCALAPPDATA%\Python\pythoncore-3.14-64\Scripts"

echo.
echo %ESC%[91m----------------------------------%ESC%[0m
echo %ESC%[93mInstalling dependencies...%ESC%[0m
pip install frida frida-tools >nul 2>&1
call npm install -g frida-compile >nul 2>&1
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
set "PYTEMP=%TEMP%\monkong_%RANDOM%.py"
powershell -NoProfile -ExecutionPolicy Bypass -Command "[IO.File]::WriteAllText('%PYTEMP%', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('aW1wb3J0IGZyaWRhLCBzeXMsIG9zLCB1cmxsaWIucmVxdWVzdCwgdGltZSwgdGVtcGZpbGUsIHNodXRpbCwgc3VicHJvY2VzcwoKQkFTRSA9ICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbW9ua29uZ2xpdmUtZGV2L01lbnVTZXJ2ZXJzL21haW4iCgpTQ1JJUFRTID0gewogICAgImJyaWRnZSI6IHsidXJsIjogIi9mcmlkYS1pbDJjcHAtYnJpZGdlLmpzIiwgImFsd2F5cyI6IFRydWV9LAogICAgInN5bWJvbHMiOiB7InVybCI6ICIvc3ltYm9scy50cyIsICJhbHdheXMiOiBUcnVlfSwKICAgICJtZW51IjogeyJ1cmwiOiAiL01vbmtzTWVudS50cyIsICJtb2RlcyI6IFsibWVudSIsICJhbGwiXX0sCiAgICAiZWFjIjogeyJ1cmwiOiAiL0J5cGFzc2VkL2VhYy50cyIsICJtb2RlcyI6IFsiZWFjIiwgImFsbCIsICJwY21vZGUiXX0sCiAgICAic3R1ZmYiOiB7InVybCI6ICIvQnlwYXNzZWQvc3R1ZmYuanMiLCAibW9kZXMiOiBbImVhYyIsICJhbGwiLCAicGNtb2RlIl19LAogICAgInBjbW9kZSI6IHsidXJsIjogIi9wY21vZGUudHMiLCAibW9kZXMiOiBbInBjbW9kZSJdfSwKICAgICJxdWVzdCI6IHsidXJsIjogIi9tNHF1ZXN0LnRzIiwgIm1vZGVzIjogWyJxdWVzdCIsICJhbGwiXX0sCiAgICAicnBjIjogeyJ1cmwiOiAiL2Rpc2NvcmRycGMudHMiLCAibW9kZXMiOiBbImFsbCJdfSwKfQoKZGVmIGZldGNoKHVybCk6CiAgICB0cnk6CiAgICAgICAgciA9IHVybGxpYi5yZXF1ZXN0LlJlcXVlc3QodXJsLCBoZWFkZXJzPXsiVXNlci1BZ2VudCI6ICJNb25rc01lbnUvMS4wIn0pCiAgICAgICAgcmV0dXJuIHVybGxpYi5yZXF1ZXN0LnVybG9wZW4ociwgdGltZW91dD0xNSkucmVhZCgpLmRlY29kZSgidXRmLTgiKQogICAgZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgICAgIHByaW50KGYiICBbIV0gRmFpbGVkOiB7ZX0iKQogICAgICAgIHJldHVybiBOb25lCgpkZWYgY29tcGlsZV90cyhzb3VyY2UsIG5hbWUsIHRtcGRpcik6CiAgICB0c19wYXRoID0gb3MucGF0aC5qb2luKHRtcGRpciwgZiJ7bmFtZX0udHMiKQogICAganNfcGF0aCA9IG9zLnBhdGguam9pbih0bXBkaXIsIGYie25hbWV9LmpzIikKICAgIHdpdGggb3Blbih0c19wYXRoLCAidyIsIGVuY29kaW5nPSJ1dGYtOCIpIGFzIGY6CiAgICAgICAgZi53cml0ZShzb3VyY2UpCiAgICB0cnk6CiAgICAgICAgcmVzdWx0ID0gc3VicHJvY2Vzcy5ydW4oCiAgICAgICAgICAgIFsibnB4IiwgImZyaWRhLWNvbXBpbGUiLCB0c19wYXRoLCAiLW8iLCBqc19wYXRoXSwKICAgICAgICAgICAgY2FwdHVyZV9vdXRwdXQ9VHJ1ZSwgdGV4dD1UcnVlLCB0aW1lb3V0PTMwCiAgICAgICAgKQogICAgICAgIGlmIG9zLnBhdGguZXhpc3RzKGpzX3BhdGgpOgogICAgICAgICAgICB3aXRoIG9wZW4oanNfcGF0aCwgInIiLCBlbmNvZGluZz0idXRmLTgiKSBhcyBmOgogICAgICAgICAgICAgICAgcmV0dXJuIGYucmVhZCgpCiAgICAgICAgZWxzZToKICAgICAgICAgICAgcHJpbnQoZiIgIFshXSBmcmlkYS1jb21waWxlIGZhaWxlZDoge3Jlc3VsdC5zdGRlcnJbOjIwMF19IikKICAgICAgICAgICAgcmV0dXJuIE5vbmUKICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgICAgICBwcmludChmIiAgWyFdIENvbXBpbGUgZXJyb3I6IHtlfSIpCiAgICAgICAgcmV0dXJuIE5vbmUKCmRlZiBmaW5kX3Byb2Nlc3MoKToKICAgIGRldmljZSA9IGZyaWRhLmdldF9sb2NhbF9kZXZpY2UoKQogICAgZm9yIHByb2MgaW4gZGV2aWNlLmVudW1lcmF0ZV9wcm9jZXNzZXMoKToKICAgICAgICBpZiBwcm9jLm5hbWUubG93ZXIoKSA9PSAiYW5pbWFsY29tcGFueS5leGUiOgogICAgICAgICAgICByZXR1cm4gcHJvYy5waWQKICAgIHJldHVybiBOb25lCgptb2RlID0gc3lzLmFyZ3ZbMV0gaWYgbGVuKHN5cy5hcmd2KSA+IDEgZWxzZSAibWVudSIKcHJpbnQoZiJcblsqXSBNb2RlOiB7bW9kZS51cHBlcigpfSIpCnByaW50KCJbKl0gUmVhZGluZyB3ZWIgc3RyZWFtLi4uXG4iKQoKdXJscyA9IFtdCmZvciBuYW1lLCBpbmZvIGluIFNDUklQVFMuaXRlbXMoKToKICAgIGFsd2F5cyA9IGluZm8uZ2V0KCJhbHdheXMiLCBGYWxzZSkKICAgIG1vZGVzID0gaW5mby5nZXQoIm1vZGVzIiwgW10pCiAgICB1cmwgPSBpbmZvLmdldCgidXJsIiwgIiIpCiAgICBpZiB1cmwgYW5kIChhbHdheXMgb3IgbW9kZSBpbiBtb2RlcyBvciBtb2RlID09ICJhbGwiKToKICAgICAgICBmdWxsID0gdXJsIGlmIHVybC5zdGFydHN3aXRoKCJodHRwIikgZWxzZSBmIntCQVNFfXt1cmx9IgogICAgICAgIHVybHMuYXBwZW5kKHsibmFtZSI6IG5hbWUsICJ1cmwiOiBmdWxsfSkKCmxvYWRlZCA9IFtdCnRtcGRpciA9IHRlbXBmaWxlLm1rZHRlbXAocHJlZml4PSJtb25rb25nX2NvbXBpbGVfIikKZm9yIHMgaW4gdXJsczoKICAgIHByaW50KGYiICBSZWFkaW5nIHdlYiByZXNwb25zZToge3NbJ25hbWUnXX0uLi4iKQogICAgc3JjID0gZmV0Y2goc1sidXJsIl0pCiAgICBpZiBzcmM6CiAgICAgICAgbG9hZGVkLmFwcGVuZCgoc1sibmFtZSJdLCBzcmMpKQogICAgICAgIHByaW50KGYiICBbK10gR290IHtzWyduYW1lJ119ICh7bGVuKHNyYyl9IGJ5dGVzKSIpCiAgICBlbHNlOgogICAgICAgIHByaW50KGYiICBbIV0gU2tpcHBlZCB7c1snbmFtZSddfSIpCgppZiBub3QgbG9hZGVkOgogICAgcHJpbnQoIlshXSBObyBzY3JpcHRzIGZldGNoZWQiKQogICAgc2h1dGlsLnJtdHJlZSh0bXBkaXIsIGlnbm9yZV9lcnJvcnM9VHJ1ZSkKICAgIHN5cy5leGl0KDEpCgpwcmludChmIlxuWypdIENvbXBpbGluZyBUeXBlU2NyaXB0Li4uIikKY29tcGlsZWQgPSBbXQpmb3IgbmFtZSwgc3JjIGluIGxvYWRlZDoKICAgIGlmIG5hbWUuZW5kc3dpdGgoIi50cyIpOgogICAgICAgIGpzID0gY29tcGlsZV90cyhzcmMsIG5hbWUsIHRtcGRpcikKICAgICAgICBpZiBqczoKICAgICAgICAgICAgY29tcGlsZWQuYXBwZW5kKChuYW1lLCBqcykpCiAgICAgICAgICAgIHByaW50KGYiICBbK10gQ29tcGlsZWQge25hbWV9IikKICAgICAgICBlbHNlOgogICAgICAgICAgICBwcmludChmIiAgWyFdIEZhaWxlZCB0byBjb21waWxlIHtuYW1lfSwgc2tpcHBpbmciKQogICAgZWxzZToKICAgICAgICBjb21waWxlZC5hcHBlbmQoKG5hbWUsIHNyYykpCiAgICAgICAgcHJpbnQoZiIgIFsrXSBKUyByZWFkeSB7bmFtZX0iKQoKc2h1dGlsLnJtdHJlZSh0bXBkaXIsIGlnbm9yZV9lcnJvcnM9VHJ1ZSkKCnByaW50KGYiXG5bKl0gTGF1bmNoIEFuaW1hbCBDb21wYW55IHRocm91Z2ggU3RlYW0gbm93Li4uIikKcHJpbnQoIlsqXSBXYWl0aW5nIGZvciBBbmltYWxDb21wYW55LmV4ZS4uLiIpCnBpZCA9IE5vbmUKZm9yIGkgaW4gcmFuZ2UoMTIwKToKICAgIHBpZCA9IGZpbmRfcHJvY2VzcygpCiAgICBpZiBwaWQ6CiAgICAgICAgYnJlYWsKICAgIHRpbWUuc2xlZXAoMSkKCmlmIG5vdCBwaWQ6CiAgICBwcmludCgiWyFdIFRpbWVkIG91dCB3YWl0aW5nIGZvciBBbmltYWxDb21wYW55LmV4ZSIpCiAgICBzeXMuZXhpdCgxKQoKcHJpbnQoZiJbKl0gRm91bmQgUElEIHtwaWR9IC0gYXR0YWNoaW5nLi4uIikKdHJ5OgogICAgc2Vzc2lvbiA9IGZyaWRhLmdldF9sb2NhbF9kZXZpY2UoKS5hdHRhY2gocGlkKQogICAgcHJpbnQoZiJbKl0gQXR0YWNoZWQgdG8gUElEIHtwaWR9IikKZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgcHJpbnQoZiJbIV0gQXR0YWNoIGZhaWxlZDoge2V9IikKICAgIHN5cy5leGl0KDEpCgpmb3IgbmFtZSwgc3JjIGluIGNvbXBpbGVkOgogICAgdHJ5OgogICAgICAgIHMgPSBzZXNzaW9uLmNyZWF0ZV9zY3JpcHQoc3JjLCBuYW1lPW5hbWUpCiAgICAgICAgcy5sb2FkKCkKICAgICAgICBwcmludChmIiAgWytdIEluamVjdGVkIHtuYW1lfSIpCiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6CiAgICAgICAgcHJpbnQoZiIgIFshXSBGYWlsZWQge25hbWV9OiB7ZX0iKQoKcHJpbnQoZiJcblsqXSB7bGVuKGNvbXBpbGVkKX0gc2NyaXB0KHMpIGluIG1lbW9yeSIpCnByaW50KCJbKl0gTm90aGluZyBvbiBkaXNrIC0gYWxsIHRyYW5zbWl0dGVkIikKcHJpbnQoIlsqXSBQcmVzcyBDdHJsK0MgdG8gZGV0YWNoXG4iKQp0cnk6CiAgICB3aGlsZSBUcnVlOgogICAgICAgIHRpbWUuc2xlZXAoMSkKZXhjZXB0IEtleWJvYXJkSW50ZXJydXB0OgogICAgcHJpbnQoIlxuWypdIERldGFjaGluZy4uLiIpCiAgICBzZXNzaW9uLmRldGFjaCgpCiAgICBwcmludCgiWypdIERvbmUiKQ==')))"
python "%PYTEMP%" %1
del /f /q "%PYTEMP%" >nul 2>&1
