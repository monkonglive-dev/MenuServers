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
powershell -NoProfile -ExecutionPolicy Bypass -Command "[IO.File]::WriteAllText('%PYTEMP%', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('aW1wb3J0IGZyaWRhLCBzeXMsIG9zLCB1cmxsaWIucmVxdWVzdCwgdGltZQoKQkFTRSA9ICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbW9ua29uZ2xpdmUtZGV2L01lbnVTZXJ2ZXJzL21haW4iCgpkZWYgZmV0Y2godXJsKToKICAgIHRyeToKICAgICAgICByID0gdXJsbGliLnJlcXVlc3QuUmVxdWVzdChCQVNFICsgdXJsLCBoZWFkZXJzPXsiVXNlci1BZ2VudCI6ICJNb25rc01lbnUvMS4wIn0pCiAgICAgICAgcmV0dXJuIHVybGxpYi5yZXF1ZXN0LnVybG9wZW4ociwgdGltZW91dD0xNSkucmVhZCgpLmRlY29kZSgidXRmLTgiKQogICAgZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgICAgIHByaW50KCIgIFshXSBGYWlsZWQ6ICIgKyB1cmwgKyAiIC0+ICIgKyBzdHIoZSkpCiAgICAgICAgcmV0dXJuIE5vbmUKCm1vZGUgPSBzeXMuYXJndlsxXSBpZiBsZW4oc3lzLmFyZ3YpID4gMSBlbHNlICJtZW51IgpwcmludCgiXG5bKl0gTW9kZTogIiArIG1vZGUudXBwZXIoKSkKCnVybHMgPSBbXQp1cmxzLmFwcGVuZCgiL0J5cGFzc2VkL2VhYy5qcyIpCgppZiBtb2RlIGluIFsiZWFjIiwgImFsbCIsICJwY21vZGUiXToKICAgIHVybHMuYXBwZW5kKCIvQnlwYXNzZWQvc3R1ZmYuanMiKQoKdXJscy5hcHBlbmQoIi9mcmlkYS1pbDJjcHAtYnJpZGdlLmpzIikKdXJscy5hcHBlbmQoIi9zeW1ib2xzLmpzIikKCmlmIG1vZGUgaW4gWyJtZW51IiwgImFsbCJdOgogICAgdXJscy5hcHBlbmQoIi9Nb25rc01lbnUuanMiKQppZiBtb2RlIGluIFsicXVlc3QiLCAiYWxsIl06CiAgICB1cmxzLmFwcGVuZCgiL200cXVlc3QuanMiKQppZiBtb2RlIGluIFsicGNtb2RlIl06CiAgICB1cmxzLmFwcGVuZCgiL3BjbW9kZS5qcyIpCmlmIG1vZGUgPT0gImFsbCI6CiAgICB1cmxzLmFwcGVuZCgiL2Rpc2NvcmRycGMuanMiKQoKcHJpbnQoIlsqXSBTY3JpcHRzIHRvIGxvYWQ6ICIgKyBzdHIodXJscykpCnByaW50KCJbKl0gUHJlc3MgYW55IGtleSB0byBhdHRhY2ggdG8gZ2FtZS4uLiIpCmlucHV0KCkKCmRldmljZSA9IGZyaWRhLmdldF9sb2NhbF9kZXZpY2UoKQoKcGlkID0gTm9uZQpmb3IgcHJvYyBpbiBkZXZpY2UuZW51bWVyYXRlX3Byb2Nlc3NlcygpOgogICAgaWYgcHJvYy5uYW1lLmxvd2VyKCkgPT0gImFuaW1hbGNvbXBhbnkuZXhlIjoKICAgICAgICBwaWQgPSBwcm9jLnBpZAogICAgICAgIGJyZWFrCgppZiBub3QgcGlkOgogICAgcHJpbnQoIlshXSBhbmltYWxjb21wYW55LmV4ZSBub3QgZm91bmQuIFN0YXJ0IHRoZSBnYW1lIGZpcnN0LiIpCiAgICBzeXMuZXhpdCgxKQoKcHJpbnQoIlsqXSBBdHRhY2hpbmcgdG8gUElEOiAiICsgc3RyKHBpZCkpCnNlc3Npb24gPSBkZXZpY2UuYXR0YWNoKHBpZCkKCmZvciB1cmwgaW4gdXJsczoKICAgIGNvZGUgPSBmZXRjaCh1cmwpCiAgICBpZiBjb2RlOgogICAgICAgIHRyeToKICAgICAgICAgICAgcyA9IHNlc3Npb24uY3JlYXRlX3NjcmlwdChjb2RlKQogICAgICAgICAgICBzLmxvYWQoKQogICAgICAgICAgICBwcmludCgiWytdIExvYWRlZDogIiArIHVybCkKICAgICAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6CiAgICAgICAgICAgIHByaW50KCJbIV0gRmFpbGVkOiAiICsgdXJsICsgIiAtPiAiICsgc3RyKGUpKQogICAgZWxzZToKICAgICAgICBwcmludCgiWyFdIENvdWxkIG5vdCBmZXRjaDogIiArIHVybCkKCnByaW50KCJbKl0gRG9uZSEiKQp0aW1lLnNsZWVwKDIpCg==')))"
python "%PYTEMP%" %1
del /f /q "%PYTEMP%" >nul 2>&1
