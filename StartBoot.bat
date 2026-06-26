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
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
 "$b64='aW1wb3J0IGZyaWRhLCBzeXMsIG9zLCB1cmxsaWIucmVxdWVzdCwgdGltZSwgdGVtcGZpbGUsIHNodXRpbCwgc3VicHJvY2VzcywganNvbgoKR0FNRSA9IHIiQzpcUHJvZ3JhbSBGaWxlcyAoeDg2KVxTdGVhbVxzdGVhbWFwcHNcY29tbW9uXEFuaW1hbCBDb21wYW55XEFuaW1hbENvbXBhbnkuZXhlIgpCQVNFID0gImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9tb25rb25nbGl2ZS1kZXYvTWVudVNlcnZlcnMvbWFpbiIKClNDUklQVFMgPSB7CiAgICAiYnJpZGdlIjogeyJ1cmwiOiAiL2ZyaWRhLWlsMmNwcC1icmlkZ2UuanMiLCAiYWx3YXlzIjogVHJ1ZX0sCiAgICAic3ltYm9scyI6IHsidXJsIjogIi9zeW1ib2xzLnRzIiwgImFsd2F5cyI6IFRydWV9LAogICAgIm1lbnUiOiB7InVybCI6ICIvTW9ua3NNZW51LnRzIiwgIm1vZGVzIjogWyJtZW51IiwgImFsbCJdfSwKICAgICJlYWMiOiB7InVybCI6ICIvQnlwYXNzZWQvZWFjLnRzIiwgIm1vZGVzIjogWyJlYWMiLCAiYWxsIiwgInBjbW9kZSJdfSwKICAgICJzdHVmZiI6IHsidXJsIjogIi9CeXBhc3NlZC9zdHVmZi5qcyIsICJtb2RlcyI6IFsiZWFjIiwgImFsbCIsICJwY21vZGUiXX0sCiAgICAicGNtb2RlIjogeyJ1cmwiOiAiL3BjbW9kZS50cyIsICJtb2RlcyI6IFsicGNtb2RlIl19LAogICAgInF1ZXN0IjogeyJ1cmwiOiAiL200cXVlc3QudHMiLCAibW9kZXMiOiBbInF1ZXN0IiwgImFsbCJdfSwKICAgICJycGMiOiB7InVybCI6ICIvZGlzY29yZHJwYy50cyIsICJtb2RlcyI6IFsiYWxsIl19LAp9CgpkZWYgZmV0Y2godXJsKToKICAgIHRyeToKICAgICAgICByID0gdXJsbGliLnJlcXVlc3QuUmVxdWVzdCh1cmwsIGhlYWRlcnM9eyJVc2VyLUFnZW50IjogIk1vbmtzTWVudS8xLjAifSkKICAgICAgICByZXR1cm4gdXJsbGliLnJlcXVlc3QudXJsb3BlbihyLCB0aW1lb3V0PTE1KS5yZWFkKCkuZGVjb2RlKCJ1dGYtOCIpCiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6CiAgICAgICAgcHJpbnQoZiIgIFshXSBGYWlsZWQ6IHtlfSIpCiAgICAgICAgcmV0dXJuIE5vbmUKCmRlZiBzdHJpcF90eXBlc2NyaXB0KHNvdXJjZSk6CiAgICBpbXBvcnQgcmUKICAgIHMgPSBzb3VyY2UKICAgIHMgPSByZS5zdWIocidkZWNsYXJlXHMrKGNvbnN0fGxldHx2YXJ8ZnVuY3Rpb258Y2xhc3N8aW50ZXJmYWNlfHR5cGV8ZW51bXxtb2R1bGV8bmFtZXNwYWNlKVxzK1x3K1teO10qOycsICcnLCBzKQogICAgcyA9IHJlLnN1YihyJzpccyooc3RyaW5nfG51bWJlcnxib29sZWFufHZvaWR8YW55fG51bGx8dW5kZWZpbmVkfG5ldmVyfHVua25vd258b2JqZWN0KVbiJywgJycsIHMpCiAgICBzID0gcmUuc3ViKHInOlxzKihcdysoXC5cdyspKilccyooXHx8LHxcKXw7fD18PHxceyknLCBsYW1iZGEgbTogbS5ncm91cCgzKSwgcykKICAgIHMgPSByZS5zdWIocic8W148Pl0qPicsICcnLCBzKQogICAgcyA9IHJlLnN1YihyJ2FzXHMrXHcrJywgJycsIHMpCiAgICBzID0gcmUuc3ViKHInaW50ZXJmYWNlXHMrXHcrXHMqXHtbXn1dKlx9JywgJycsIHMpCiAgICBzID0gcmUuc3ViKHIndHlwZVxzK1x3K1xzKj1ccypbXjtdKjsnLCAnJywgcykKICAgIHMgPSByZS5zdWIocidlbnVtXHMrXHcrXHMqXHtbXn1dKlx9JywgJycsIHMpCiAgICBzID0gcmUuc3ViKHInaW1wbGVtZW50c1xzK1tcdyxcc10rJywgJycsIHMpCiAgICBzID0gcmUuc3ViKHInLFxzKlwpJywgJyknLCBzKQogICAgcyA9IHJlLnN1YihyJyxccyosJywgJywnLCBzKQogICAgcmV0dXJuIHMKCm1vZGUgPSBzeXMuYXJndlsxXSBpZiBsZW4oc3lzLmFyZ3YpID4gMSBlbHNlICJtZW51IgpwcmludChmIlxuWypdIE1vZGU6IHttb2RlLnVwcGVyKCl9IikKcHJpbnQoIlsqXSBSZWFkaW5nIHdlYiBzdHJlYW0uLi5cbiIpCgp1cmxzID0gW10KZm9yIG5hbWUsIGluZm8gaW4gU0NSSVBUUy5pdGVtcygpOgogICAgYWx3YXlzID0gaW5mby5nZXQoImFsd2F5cyIsIEZhbHNlKQogICAgbW9kZXMgPSBpbmZvLmdldCgibW9kZXMiLCBbXSkKICAgIHVybCA9IGluZm8uZ2V0KCJ1cmwiLCAiIikKICAgIGlmIHVybCBhbmQgKGFsd2F5cyBvciBtb2RlIGluIG1vZGVzIG9yIG1vZGUgPT0gImFsbCIpOgogICAgICAgIGZ1bGwgPSB1cmwgaWYgdXJsLnN0YXJ0c3dpdGgoImh0dHAiKSBlbHNlIGYie0JBU0V9e3VybH0iCiAgICAgICAgdXJscy5hcHBlbmQoeyJuYW1lIjogbmFtZSwgInVybCI6IGZ1bGx9KQoKbG9hZGVkID0gW10KZm9yIHMgaW4gdXJsczoKICAgIHByaW50KGYiICBSZWFkaW5nIHdlYiByZXNwb25zZToge3NbJ25hbWUnXX0uLi4iKQogICAgc3JjID0gZmV0Y2goc1sidXJsIl0pCiAgICBpZiBzcmM6CiAgICAgICAgbG9hZGVkLmFwcGVuZCgoc1sibmFtZSJdLCBzcmMpKQogICAgICAgIHByaW50KGYiICBbK10gR290IHtzWyduYW1lJ119ICh7bGVuKHNyYyl9IGJ5dGVzKSIpCiAgICBlbHNlOgogICAgICAgIHByaW50KGYiICBbIV0gU2tpcHBlZCB7c1snbmFtZSddfSIpCgppZiBub3QgbG9hZGVkOgogICAgcHJpbnQoIlshXSBObyBzY3JpcHRzIGZldGNoZWQiKQogICAgc3lzLmV4aXQoMSkKCnByaW50KGYiXG5bKl0gQ29tcGlsaW5nIFR5cGVTY3JpcHQuLi4iKQpjb21waWxlZCA9IFtdCmZvciBuYW1lLCBzcmMgaW4gbG9hZGVkOgogICAgaWYgbmFtZS5lbmRzd2l0aCgiLnRzIikgb3IgKCIudHMiIGluIG5hbWUpOgogICAgICAgIGpzID0gc3RyaXBfdHlwZXNjcmlwdChzcmMpCiAgICAgICAgY29tcGlsZWQuYXBwZW5kKChuYW1lLCBqcykpCiAgICAgICAgcHJpbnQoZiIgIFsrXSBDb21waWxlZCB7bmFtZX0iKQogICAgZWxzZToKICAgICAgICBjb21waWxlZC5hcHBlbmQoKG5hbWUsIHNyYykpCiAgICAgICAgcHJpbnQoZiIgIFsrXSBKUyByZWFkeSB7bmFtZX0iKQoKcHJpbnQoZiJcblsqXSBTcGF3bmluZyBBbmltYWxDb21wYW55LmV4ZS4uLiIpCnRyeToKICAgIHBpZCA9IGZyaWRhLnNwYXduKFtHQU1FXSkKICAgIHNlc3Npb24gPSBmcmlkYS5nZXRfbG9jYWxfZGV2aWNlKCkuYXR0YWNoKHBpZCkKICAgIHByaW50KGYiWypdIFNwYXduZWQgUElEIHtwaWR9IikKICAgIGZyaWRhLnJlc3VtZShwaWQpCmV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgIHByaW50KGYiWyFdIFNwYXduIGZhaWxlZDoge2V9IikKICAgIHN5cy5leGl0KDEpCgpmb3IgbmFtZSwgc3JjIGluIGNvbXBpbGVkOgogICAgdHJ5OgogICAgICAgIHMgPSBzZXNzaW9uLmNyZWF0ZV9zY3JpcHQoc3JjLCBuYW1lPW5hbWUpCiAgICAgICAgcy5sb2FkKCkKICAgICAgICBwcmludChmIiAgWytdIEluamVjdGVkIHtuYW1lfSIpCiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6CiAgICAgICAgcHJpbnQoZiIgIFshXSBGYWlsZWQge25hbWV9OiB7ZX0iKQoKcHJpbnQoZiJcblsqXSB7bGVuKGNvbXBpbGVkKX0gc2NyaXB0KHMpIGluIG1lbW9yeSIpCnByaW50KCJbKl0gTm90aGluZyBvbiBkaXNrIC0gYWxsIHRyYW5zbWl0dGVkIikKcHJpbnQoIlsqXSBQcmVzcyBDdHJsK0MgdG8gZGV0YWNoXG4iKQp0cnk6CiAgICB3aGlsZSBUcnVlOgogICAgICAgIHRpbWUuc2xlZXAoMSkKZXhjZXB0IEtleWJvYXJkSW50ZXJydXB0OgogICAgcHJpbnQoIlxuWypdIERldGFjaGluZy4uLiIpCiAgICBzZXNzaW9uLmRldGFjaCgpCiAgICBwcmludCgiWypdIERvbmUiKQ==';" ^
 "[IO.File]::WriteAllText('%PYTEMP%', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64)))"
python "%PYTEMP%" %1
del /f /q "%PYTEMP%" >nul 2>&1
