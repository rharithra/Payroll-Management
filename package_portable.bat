@echo off
setlocal
set ROOT=%~dp0
set DIST=%ROOT%dist

rem Clean dist
if exist "%DIST%" rmdir /S /Q "%DIST%"
mkdir "%DIST%"

rem Build frontend (requires Node.js on YOUR machine only)
pushd "%ROOT%frontend"
echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
  echo npm install failed; attempting clean install with npm ci...
  call npm ci
  if errorlevel 1 (
    echo ERROR: npm install/ci failed. See npm logs under %%LOCALAPPDATA%%\npm-cache\_logs.
    exit /b 1
  )
)
echo Building frontend...
call npm run build
popd

rem Copy frontend build into backend static resources
if exist "%ROOT%src\main\resources\static" rmdir /S /Q "%ROOT%src\main\resources\static"
xcopy /E /I /Y "%ROOT%frontend\build" "%ROOT%src\main\resources\static" >nul

rem Build backend JAR (requires Maven on YOUR machine only)
pushd "%ROOT%"
call mvn clean package -DskipTests
if errorlevel 1 (
  echo ERROR: Maven build failed.
  exit /b 1
)
popd

rem Assemble portable bundle
mkdir "%DIST%\Config"
mkdir "%DIST%\data"
xcopy /E /I /Y "%ROOT%Config\*" "%DIST%\Config\" >nul
if exist "%ROOT%data\salarydb.mv.db" xcopy /E /I /Y "%ROOT%data\*" "%DIST%\data\" >nul
xcopy /E /I /Y "%ROOT%jdk-17.0.17+10-jre" "%DIST%\jdk-17.0.17+10-jre\" >nul
copy /Y "%ROOT%target\salary-management-0.0.1-SNAPSHOT.jar" "%DIST%\salary-management-0.0.1-SNAPSHOT.jar" >nul

(
  echo @echo off
  echo setlocal
  echo set APP_DIR=%%~dp0
  echo set JAVA="%%APP_DIR%%jdk-17.0.17+10-jre\bin\java.exe"
  echo set JAR="%%APP_DIR%%salary-management-0.0.1-SNAPSHOT.jar"
  echo if not exist %%JAVA%% ^(
  echo   echo ERROR: Bundled JRE missing. Expected %%JAVA%%.
  echo   exit /b 1
  echo ^)
  echo if not exist %%JAR%% ^(
  echo   echo ERROR: JAR missing. Expected %%JAR%%.
  echo   exit /b 1
  echo ^)
  echo echo Starting Salary App...
  echo %%JAVA%% -jar %%JAR%% --spring.config.location=optional:"%%APP_DIR%%Config\application.properties"
) > "%DIST%\run_portable.bat"

echo Portable bundle created: %DIST%
endlocal