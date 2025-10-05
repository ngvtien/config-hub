@echo off
title Config Hub - Starting...
echo.
echo  ╔══════════════════════════════════════╗
echo  ║            Config Hub                ║
echo  ║   Secure Credential Management       ║
echo  ║                                      ║
echo  ║         Starting application...      ║
echo  ║                                      ║
echo  ║    Please wait while we initialize   ║
echo  ║         your secure environment      ║
echo  ╚══════════════════════════════════════╝
echo.
echo %TIME% - Starting Config Hub...
echo.
echo If this takes more than 5 seconds, it may be due to:
echo - Windows Defender scanning the executable
echo - Antivirus software real-time protection
echo - System resources or disk I/O
echo.
echo Loading security modules...
start /wait "Config Hub" "Config Hub_1.0.0.exe"
echo.
echo %TIME% - Config Hub closed
pause