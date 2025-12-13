@echo off
setlocal
set APP_DIR=%~dp0
set JRE="%APP_DIR%jdk-17.0.17+10-jre\bin\java.exe"
set JAR="%APP_DIR%target\salary-management-0.0.1-SNAPSHOT.jar"

echo Using JRE:
%JRE% -version

echo Starting application...
%JRE% -jar %JAR% --spring.config.location=optional:"%APP_DIR%Config\application.properties"
pause