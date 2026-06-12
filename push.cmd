@echo off
rem Eén commando voor de hele afsluit-flow: tsc-check -> commit -> push.
rem Gebruik:  push            (commitbericht = "Update t/m <BUILD>")
rem           push eigen tekst hier   (eigen commitbericht)
setlocal
cd /d "%~dp0"

echo === TypeScript-check ===
call npx tsc --noEmit
if errorlevel 1 (
  echo.
  echo FOUTEN gevonden - er is NIET gecommit of gepusht.
  exit /b 1
)

rem Versielabel uit src\pwa.ts halen voor het standaard-commitbericht.
set BUILD=
for /f tokens^=2^ delims^=^" %%v in ('findstr /C:"export const BUILD" src\pwa.ts') do set BUILD=%%v

if "%~1"=="" (set MSG=Update t/m %BUILD%) else (set MSG=%*)

rem Stale lock van een vorige (sandbox-)sessie opruimen als die er ligt.
if exist .git\index.lock del /f .git\index.lock

echo === Commit + push: "%MSG%" ===
git add -A
git commit -m "%MSG%"
git push

echo.
echo Klaar. Footer-check na deploy: %BUILD%
endlocal
