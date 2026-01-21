@echo off
title Disparador Bot - Agendado
echo Iniciando Disparador em Modo Unico...
cd /d "%~dp0"

:: Define variavel para fechar quando acabar
set EXIT_ON_EMPTY=true

:: Executa o bot
npm start

echo.
echo Processo finalizado.
timeout /t 5
