@echo off
SETLOCAL
cd /d "%~dp0"

echo ===================================================
echo   CONFIGURACAO DO AGENDAMENTO (WINDOWS SCHEDULER)
echo ===================================================
echo.
echo Este script ira criar duas tarefas no Agendador do Windows:
echo 1. DisparadorBot_Manha (12:00)
echo 2. DisparadorBot_Tarde (17:00)
echo.
echo O script a ser executado sera: %CD%\run_bot_scheduled.bat
echo.
pause

:: Cria tarefa 12:00
schtasks /create /tn "DisparadorBot_Manha" /tr "'%CD%\run_bot_scheduled.bat'" /sc daily /st 12:00 /f
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao criar agendamento das 12:00. Tente executar como Administrador.
) else (
    echo [OK] Agendamento 12:00 criado com sucesso.
)

:: Cria tarefa 17:00
schtasks /create /tn "DisparadorBot_Tarde" /tr "'%CD%\run_bot_scheduled.bat'" /sc daily /st 17:00 /f
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao criar agendamento das 17:00.
) else (
    echo [OK] Agendamento 17:00 criado com sucesso.
)

echo.
echo ===================================================
echo IMPORTANTE:
echo Na primeira vez, voce deve rodar "run_bot_scheduled.bat" MANUALMENTE
echo para escanear o QR Code do WhatsApp.
echo ===================================================
echo.
pause
