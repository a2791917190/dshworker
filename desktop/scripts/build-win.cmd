@echo off
REM DSHwork Windows 构建脚本(NSIS 安装包)
REM 用法:在 desktop 目录下运行  build-win.cmd
REM 注意:若 PowerShell 执行策略禁止运行 npm.ps1,请用本 .cmd 或直接调 npm.cmd。

cd /d "%~dp0"

echo [1/3] 安装依赖...
call npm.cmd install || goto :err

echo [2/3] 构建 Windows x64 安装包...
call npm.cmd run build:win || goto :err

echo [3/3] 完成!产物在 dist\ 目录下。
exit /b 0

:err
echo 构建失败,请检查上方错误信息。
exit /b 1
