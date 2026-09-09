@echo off
REM DSHwork 离线自包含打包(vendor node + Harness + 共享依赖),需联网 + 已装 node/npm。
REM 双击或在此目录终端运行: vendor-runtime.cmd [--npm-registry ...] [--node-mirror ...]
cd /d "%~dp0"
echo [DSHwork] 开始打包离线自包含客户端...
call npm run vendor:runtime %*
if errorlevel 1 (
  echo.
  echo 打包失败。若提示网络问题,请用:
  echo   vendor-runtime.cmd --npm-registry https://registry.npmmirror.com --node-mirror https://npmmirror.com/mirrors/node
  exit /b 1
)
echo.
echo 完成!请看上方输出的 zip 路径。
pause
