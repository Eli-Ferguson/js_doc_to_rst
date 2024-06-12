echo off

@REM cd %~dp0/_js_doc_to_rst
echo %cd%

@REM echo Uninstalling js_doc_to_rst
@REM call npm un js_doc_to_rst >nul 2>&1
@REM echo Uninstalled

@REM echo Reinstalling js_doc_to_rst
@REM call npm i --save-dev ./JSDocToRST/ >nul 2>&1
@REM echo Reinstalled

@REM call npx js_doc_to_rst -c ./JSDocToRST.config.json

call node ./JSDocToRST/bin/index.js -c ./JSDocToRST.config.json

@REM call node ./JSDocToRST/bin/js_comments.js -c ./JSDocToRST.config.json

pause