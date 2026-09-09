@echo off
chcp 65001 >nul
echo ============================================================
echo  DSHwork 客户端 清理/还原脚本
echo.
echo  会做三件事(安全第一,每步都先提示):
echo   1) 结束卡住的 harness / npx / node 进程
echo   2) 删除 DSHwork 客户端的数据目录(dsh-home)
echo   3) 清理系统临时目录里的 DSHwork 解压残渣
echo.
echo  ⚠️ 第 1 步会结束本机所有 node.exe(如果这台电脑还跑着其它
echo     Node 程序,请先关掉它们,或手动跳过第 1 步)。
echo ============================================================
echo.
set /p ANS=是否继续?输入 y 继续,其它取消 :
if /i not "%ANS%"=="y" goto :done

echo.
echo [1/3] 结束 node.exe / npx 进程...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npx.exe >nul 2>&1
echo      (已尝试结束;若仍有卡住的窗口,请到"任务管理器"手动结束)

echo.
echo [2/3] 删除 DSHwork 客户端数据目录...
if exist "%LOCALAPPDATA%\dshwork\dsh-home" rmdir /s /q "%LOCALAPPDATA%\dshwork\dsh-home"
if exist "%APPDATA%\dshwork\dsh-home" rmdir /s /q "%APPDATA%\dshwork\dsh-home"
echo      已删除(若以后想保留模型凭据,可先备份)
echo      (如果你想同时清掉全局 ~/.dsh 里的 DSHwork profile,请手动删除
echo       %USERPROFILE%\.dsh\profiles\web 与 %USERPROFILE%\.dsh\profiles\node_modules)

echo.
echo [3/3] 清理系统临时目录里的 DSHwork 解压残渣...
for /d %%d in ("%TEMP%\dshwork-*") do rmdir /s /q "%%d" 2>nul
for /d %%d in ("%TEMP%\dshwork-auth-*") do rmdir /s /q "%%d" 2>nul
echo      已清理

echo.
echo ============================================================
echo  清理完成!
echo.
echo  接下来正确做法:
echo   1) 把【新包】DSHwork-portable-0.1.0-win-x64-integrated.zip
echo      解压到一个【固定目录】(例如 D:\DSHwork,不要放 Temp 临时目录)
echo   2) 双击里面的 DSHwork.exe 运行
echo ============================================================
pause
exit /b 0

:done
echo 已取消,未做任何修改。
pause
