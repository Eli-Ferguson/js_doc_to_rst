echo off

REM Define the list of directories to delete
set DIRS_TO_DELETE="%~dp0Docs\RST" "%~dp0Docs\Sphinx"

REM Iterate over the list and delete each directory
for %%d in (%DIRS_TO_DELETE%) do (
    if exist "%%~d" (
        echo Deleting directory: %%~d
        rmdir /Q /S "%%~d"
        echo Directory deleted: %%~d
    ) else (
        echo Directory does not exist: %%~d
    )
)

set Doc_Dir=%~dp0%\Docs

REM Check if the directory already exists
if exist "%Doc_Dir%" (
    echo Directory already exists: %Doc_Dir%
) else (
    echo Creating directory: %Doc_Dir%
    mkdir "%Doc_Dir%"
    echo Directory created.
)

timeout 1 > NUL

cd %~dp0/_js_doc_to_rst
echo %cd%

echo Uninstalling js_doc_to_rst
call npm un js_doc_to_rst >nul 2>&1
echo Uninstalled

echo Reinstalling js_doc_to_rst
call npm i --save-dev ./JSDocToRST/ >nul 2>&1
echo Reinstalled

call npx js_doc_to_rst -c ./JSDocToRST.config.json

@REM call node ./JSDocToRST/bin/index.js -c ./JSDocToRST.config.json || echo Failed on JSDocToRST & exit /b

@REM call node ./JSDocToRST/bin/js_comments.js -c ./JSDocToRST.config.json

pause