@echo off
title CampusFix - XAMPP Automated Installer & Setup
echo ==========================================================
echo          CampusFix - Automated Setup for XAMPP
echo ==========================================================
echo.

set XAMPP_DIR=C:\xampp
set HTDOCS_TARGET=C:\xampp\htdocs\campusfix

if not exist "%XAMPP_DIR%" (
    echo [ERROR] XAMPP is not installed at %XAMPP_DIR%.
    echo.
    echo Please download and install XAMPP from:
    echo https://www.apachefriends.org/
    echo.
    echo After installing XAMPP, run this script again.
    echo.
    pause
    exit /b 1
)

echo [1/4] Copying CampusFix project files to %HTDOCS_TARGET% ...
if not exist "%HTDOCS_TARGET%" mkdir "%HTDOCS_TARGET%"
xcopy /E /I /Y "%~dp0*" "%HTDOCS_TARGET%\" >nul
echo       Files copied successfully.

echo [2/4] Configuring database credentials ...
if not exist "%HTDOCS_TARGET%\includes\config.php" (
    copy "%HTDOCS_TARGET%\includes\config.example.php" "%HTDOCS_TARGET%\includes\config.php" >nul
    echo       Created includes\config.php from template.
) else (
    echo       includes\config.php already exists.
)

echo [3/4] Initializing MySQL Database (campusfix_db) ...
if exist "%XAMPP_DIR%\mysql\bin\mysql.exe" (
    "%XAMPP_DIR%\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS campusfix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
    "%XAMPP_DIR%\mysql\bin\mysql.exe" -u root campusfix_db < "%HTDOCS_TARGET%\sql\database.sql" 2>nul
    if %ERRORLEVEL% equ 0 (
        echo       Database imported successfully!
    ) else (
        echo       Note: MySQL might not be running. Start MySQL in XAMPP Control Panel.
    )
) else (
    echo       Could not find mysql.exe in %XAMPP_DIR%\mysql\bin.
)

echo [4/4] Launching CampusFix in browser ...
start "" "http://localhost/campusfix/"

echo.
echo ==========================================================
echo Setup Complete!
echo Make sure Apache and MySQL are running in XAMPP Control Panel.
echo Platform URL: http://localhost/campusfix/
echo ==========================================================
pause

