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
powershell -NoProfile -ExecutionPolicy Bypass -Command "[IO.File]::WriteAllText('%PYTEMP%', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('aW1wb3J0IGZyaWRhLCBzeXMsIG9zLCB1cmxsaWIucmVxdWVzdCwgdGltZSwgdGVtcGZpbGUsIHNodXRpbCwgc3VicHJvY2VzcwoKQkFTRSA9ICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbW9ua29uZ2xpdmUtZGV2L01lbnVTZXJ2ZXJzL21haW4iCgpTQ1JJUFRTID0gewogICAgImJyaWRnZSI6IHsidXJsIjogIi9mcmlkYS1pbDJjcHAtYnJpZGdlLmpzIiwgImFsd2F5cyI6IFRydWV9LAogICAgInN5bWJvbHMiOiB7InVybCI6ICIvc3ltYm9scy50cyIsICJhbHdheXMiOiBUcnVlfSwKICAgICJtZW51IjogeyJ1cmwiOiAiL01vbmtzTWVudS50cyIsICJtb2RlcyI6IFsibWVudSIsICJhbGwiXX0sCiAgICAiZWFjIjogeyJ1cmwiOiAiL0J5cGFzc2VkL2VhYy50cyIsICJtb2RlcyI6IFsiZWFjIiwgImFsbCIsICJwY21vZGUiXX0sCiAgICAic3R1ZmYiOiB7InVybCI6ICIvQnlwYXNzZWQvc3R1ZmYuanMiLCAibW9kZXMiOiBbImVhYyIsICJhbGwiLCAicGNtb2RlIl19LAogICAgInBjbW9kZSI6IHsidXJsIjogIi9wY21vZGUudHMiLCAibW9kZXMiOiBbInBjbW9kZSJdfSwKICAgICJxdWVzdCI6IHsidXJsIjogIi9tNHF1ZXN0LnRzIiwgIm1vZGVzIjogWyJxdWVzdCIsICJhbGwiXX0sCiAgICAicnBjIjogeyJ1cmwiOiAiL2Rpc2NvcmRycGMudHMiLCAibW9kZXMiOiBbImFsbCJdfSwKfQoKZGVmIGZldGNoKHVybCk6CiAgICB0cnk6CiAgICAgICAgciA9IHVybGxpYi5yZXF1ZXN0LlJlcXVlc3QodXJsLCBoZWFkZXJzPXsiVXNlci1BZ2VudCI6ICJNb25rc01lbnUvMS4wIn0pCiAgICAgICAgcmV0dXJuIHVybGxpYi5yZXF1ZXN0LnVybG9wZW4ociwgdGltZW91dD0xNSkucmVhZCgpLmRlY29kZSgidXRmLTgiKQogICAgZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgICAgIHByaW50KGYiICBbIV0gRmFpbGVkOiB7ZX0iKQogICAgICAgIHJldHVybiBOb25lCgpkZWYgY29tcGlsZV90cyhzb3VyY2UsIG5hbWUsIHRtcGRpcik6CiAgICB0c19wYXRoID0gb3MucGF0aC5qb2luKHRtcGRpciwgZiJ7bmFtZX0udHMiKQogICAganNfcGF0aCA9IG9zLnBhdGguam9pbih0bXBkaXIsIGYie25hbWV9LmpzIikKICAgIHdpdGggb3Blbih0c19wYXRoLCAidyIsIGVuY29kaW5nPSJ1dGYtOCIpIGFzIGY6CiAgICAgICAgZi53cml0ZShzb3VyY2UpCiAgICB0cnk6CiAgICAgICAgcmVzdWx0ID0gc3VicHJvY2Vzcy5ydW4oCiAgICAgICAgICAgIFsibnB4IiwgImZyaWRhLWNvbXBpbGUiLCB0c19wYXRoLCAiLW8iLCBqc19wYXRoXSwKICAgICAgICAgICAgY2FwdHVyZV9vdXRwdXQ9VHJ1ZSwgdGV4dD1UcnVlLCB0aW1lb3V0PTYwCiAgICAgICAgKQogICAgICAgIGlmIG9zLnBhdGguZXhpc3RzKGpzX3BhdGgpOgogICAgICAgICAgICB3aXRoIG9wZW4oanNfcGF0aCwgInIiLCBlbmNvZGluZz0idXRmLTgiKSBhcyBmOgogICAgICAgICAgICAgICAgcmV0dXJuIGYucmVhZCgpCiAgICAgICAgZWxzZToKICAgICAgICAgICAgcHJpbnQoZiIgIFshXSBmcmlkYS1jb21waWxlIGZhaWxlZCBmb3Ige25hbWV9IikKICAgICAgICAgICAgaWYgcmVzdWx0LnN0ZGVycjoKICAgICAgICAgICAgICAgIHByaW50KGYiICAgICAge3Jlc3VsdC5zdGRlcnJbOjMwMF19IikKICAgICAgICAgICAgcmV0dXJuIE5vbmUKICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgICAgICBwcmludChmIiAgWyFdIENvbXBpbGUgZXJyb3IgZm9yIHtuYW1lfToge2V9IikKICAgICAgICByZXR1cm4gTm9uZQoKZGVmIGZpbmRfcHJvY2VzcygpOgogICAgZGV2aWNlID0gZnJpZGEuZ2V0X2xvY2FsX2RldmljZSgpCiAgICBmb3IgcHJvYyBpbiBkZXZpY2UuZW51bWVyYXRlX3Byb2Nlc3NlcygpOgogICAgICAgIGlmIHByb2MubmFtZS5sb3dlcigpID09ICJhbmltYWxjb21wYW55LmV4ZSI6CiAgICAgICAgICAgIHJldHVybiBwcm9jLnBpZAogICAgcmV0dXJuIE5vbmUKCm1vZGUgPSBzeXMuYXJndlsxXSBpZiBsZW4oc3lzLmFyZ3YpID4gMSBlbHNlICJtZW51IgpwcmludChmIlxuWypdIE1vZGU6IHttb2RlLnVwcGVyKCl9IikKcHJpbnQoIlsqXSBSZWFkaW5nIHdlYiBzdHJlYW0uLi5cbiIpCgp1cmxzID0gW10KZm9yIG5hbWUsIGluZm8gaW4gU0NSSVBUUy5pdGVtcygpOgogICAgYWx3YXlzID0gaW5mby5nZXQoImFsd2F5cyIsIEZhbHNlKQogICAgbW9kZXMgPSBpbmZvLmdldCgibW9kZXMiLCBbXSkKICAgIHVybCA9IGluZm8uZ2V0KCJ1cmwiLCAiIikKICAgIGlmIHVybCBhbmQgKGFsd2F5cyBvciBtb2RlIGluIG1vZGVzIG9yIG1vZGUgPT0gImFsbCIpOgogICAgICAgIGZ1bGwgPSB1cmwgaWYgdXJsLnN0YXJ0c3dpdGgoImh0dHAiKSBlbHNlIGYie0JBU0V9e3VybH0iCiAgICAgICAgdXJscy5hcHBlbmQoeyJuYW1lIjogbmFtZSwgInVybCI6IGZ1bGx9KQoKbG9hZGVkID0gW10KdG1wZGlyID0gdGVtcGZpbGUubWtkdGVtcChwcmVmaXg9Im1vbmtvbmdfY29tcGlsZV8iKQpmb3IgcyBpbiB1cmxzOgogICAgcHJpbnQoZiIgIFJlYWRpbmcgd2ViIHJlc3BvbnNlOiB7c1snbmFtZSddfS4uLiIpCiAgICBzcmMgPSBmZXRjaChzWyJ1cmwiXSkKICAgIGlmIHNyYzoKICAgICAgICBsb2FkZWQuYXBwZW5kKChzWyJuYW1lIl0sIHNyYykpCiAgICAgICAgcHJpbnQoZiIgIFsrXSBHb3Qge3NbJ25hbWUnXX0gKHtsZW4oc3JjKX0gYnl0ZXMpIikKICAgIGVsc2U6CiAgICAgICAgcHJpbnQoZiIgIFshXSBTa2lwcGVkIHtzWyduYW1lJ119IikKCmlmIG5vdCBsb2FkZWQ6CiAgICBwcmludCgiWyFdIE5vIHNjcmlwdHMgZmV0Y2hlZCIpCiAgICBzaHV0aWwucm10cmVlKHRtcGRpciwgaWdub3JlX2Vycm9ycz1UcnVlKQogICAgc3lzLmV4aXQoMSkKCnByaW50KGYiXG5bKl0gQ29tcGlsaW5nIFR5cGVTY3JpcHQuLi4iKQpjb21waWxlZCA9IFtdCmZvciBuYW1lLCBzcmMgaW4gbG9hZGVkOgogICAgaWYgbmFtZS5lbmRzd2l0aCgiLnRzIik6CiAgICAgICAganMgPSBjb21waWxlX3RzKHNyYywgbmFtZSwgdG1wZGlyKQogICAgICAgIGlmIGpzOgogICAgICAgICAgICBjb21waWxlZC5hcHBlbmQoKG5hbWUsIGpzKSkKICAgICAgICAgICAgcHJpbnQoZiIgIFsrXSBDb21waWxlZCB7bmFtZX0iKQogICAgICAgIGVsc2U6CiAgICAgICAgICAgIHByaW50KGYiICBbIV0gRmFpbGVkIHRvIGNvbXBpbGUge25hbWV9LCBza2lwcGluZyIpCiAgICBlbHNlOgogICAgICAgIGNvbXBpbGVkLmFwcGVuZCgobmFtZSwgc3JjKSkKICAgICAgICBwcmludChmIiAgWytdIEpTIHJlYWR5IHtuYW1lfSIpCgpzaHV0aWwucm10cmVlKHRtcGRpciwgaWdub3JlX2Vycm9ycz1UcnVlKQoKcHJpbnQoZiJcblsqXSBMYXVuY2ggQW5pbWFsIENvbXBhbnkgdGhyb3VnaCBTdGVhbSBub3cuLi4iKQpwcmludCgiWypdIFdhaXRpbmcgZm9yIEFuaW1hbENvbXBhbnkuZXhlLi4uIikKcGlkID0gTm9uZQpmb3IgaSBpbiByYW5nZSgxMjApOgogICAgcGlkID0gZmluZF9wcm9jZXNzKCkKICAgIGlmIHBpZDoKICAgICAgICBicmVhawogICAgdGltZS5zbGVlcCgxKQoKaWYgbm90IHBpZDoKICAgIHByaW50KCJbIV0gVGltZWQgb3V0IHdhaXRpbmcgZm9yIEFuaW1hbENvbXBhbnkuZXhlIikKICAgIHN5cy5leGl0KDEpCgpwcmludChmIlsqXSBGb3VuZCBQSUQge3BpZH0gLSBhdHRhY2hpbmcuLi4iKQp0cnk6CiAgICBkZXZpY2UgPSBmcmlkYS5nZXRfbG9jYWxfZGV2aWNlKCkKICAgIHNlc3Npb24gPSBkZXZpY2UuYXR0YWNoKHBpZCkKICAgIHByaW50KGYiWypdIEF0dGFjaGVkIHRvIFBJRCB7cGlkfSIpCmV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgIHByaW50KGYiWyFdIEF0dGFjaCBmYWlsZWQ6IHtlfSIpCiAgICBzeXMuZXhpdCgxKQoKbG9hZGVkX3NjcmlwdHMgPSBbXQpmb3IgbmFtZSwgc3JjIGluIGNvbXBpbGVkOgogICAgdHJ5OgogICAgICAgIHMgPSBzZXNzaW9uLmNyZWF0ZV9zY3JpcHQoc3JjLCBuYW1lPW5hbWUsIHJ1bnRpbWU9InY4IikKICAgICAgICBzLmxvYWQoKQogICAgICAgIGxvYWRlZF9zY3JpcHRzLmFwcGVuZCgobmFtZSwgcykpCiAgICAgICAgcHJpbnQoZiIgIFsrXSBMb2FkZWQgc2NyaXB0OiB7bmFtZX0iKQogICAgZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgICAgIHByaW50KGYiICBbIV0gRmFpbGVkIHtuYW1lfToge2V9IikKCnByaW50KGYiXG5bKl0ge2xlbihsb2FkZWRfc2NyaXB0cyl9IHNjcmlwdChzKSBsb2FkZWQgaW4gRnJpZGEiKQpwcmludCgiWypdIEFsbCBzY3JpcHRzIHJ1bm5pbmcgYXMgc2VwYXJhdGUgZW50cmllcyIpCnByaW50KCJbKl0gTm90aGluZyBvbiBkaXNrIC0gYWxsIHRyYW5zbWl0dGVkIikKcHJpbnQoIlsqXSBQcmVzcyBDdHJsK0MgdG8gZGV0YWNoXG4iKQp0cnk6CiAgICB3aGlsZSBUcnVlOgogICAgICAgIHRpbWUuc2xlZXAoMSkKZXhjZXB0IEtleWJvYXJkSW50ZXJydXB0OgogICAgcHJpbnQoIlxuWypdIFVubG9hZGluZyBzY3JpcHRzLi4uIikKICAgIGZvciBuYW1lLCBzIGluIGxvYWRlZF9zY3JpcHRzOgogICAgICAgIHRyeToKICAgICAgICAgICAgcy51bmxvYWQoKQogICAgICAgICAgICBwcmludChmIiAgWy1dIFVubG9hZGVkIHtuYW1lfSIpCiAgICAgICAgZXhjZXB0OgogICAgICAgICAgICBwYXNzCiAgICBwcmludCgiWypdIERldGFjaGluZy4uLiIpCiAgICBzZXNzaW9uLmRldGFjaCgpCiAgICBwcmludCgiWypdIERvbmUiKQ==')))"
python "%PYTEMP%" %1
del /f /q "%PYTEMP%" >nul 2>&1
