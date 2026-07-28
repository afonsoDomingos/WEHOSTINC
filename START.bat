@echo off
echo ====================================
echo WEHOSTHERE - Iniciar Projeto
echo ====================================
echo.

echo Opcoes:
echo 1. Instalar dependencias
echo 2. Iniciar servidor de desenvolvimento
echo 3. Criar build de producao
echo 4. Iniciar servidor de producao
echo 5. Sair
echo.

set /p opcao="Escolha uma opcao (1-5): "

if "%opcao%"=="1" goto install
if "%opcao%"=="2" goto dev
if "%opcao%"=="3" goto build
if "%opcao%"=="4" goto start
if "%opcao%"=="5" goto end

:install
echo.
echo Instalando dependencias...
call npm install
echo.
echo Dependencias instaladas com sucesso!
pause
goto menu

:dev
echo.
echo Iniciando servidor de desenvolvimento...
echo Acesse http://localhost:3000 no seu navegador
echo.
call npm run dev
goto menu

:build
echo.
echo Criando build de producao...
call npm run build
echo.
echo Build criada com sucesso!
pause
goto menu

:start
echo.
echo Iniciando servidor de producao...
echo Acesse http://localhost:3000 no seu navegador
echo.
call npm start
goto menu

:menu
cls
goto inicio

:inicio
goto inicio

:end
echo.
echo Obrigado por usar WEHOSTHERE!
pause
