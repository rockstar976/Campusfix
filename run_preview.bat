@echo off
title CampusFix - Instant Preview Server
echo ==========================================================
echo           CampusFix - Local Development Server
echo ==========================================================
echo Starting preview server on http://localhost:8080/ ...
echo.

start "" "http://localhost:8080/"
python preview_server.py
pause

