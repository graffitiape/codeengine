@echo off
setlocal
SET CODEENGINE_PATH=%~dp0..\..\..\..
SET CODEENGINE_DEV=1
FOR /F "tokens=* USEBACKQ" %%g IN (`where /r "%CODEENGINE_PATH%\.build\node" node.exe`) do (SET "NODE=%%g")
call "%NODE%" "%CODEENGINE_PATH%\out\server-cli.js" "Code Server - Dev" "" "" "code.cmd" %*
endlocal
