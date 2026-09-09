#!/usr/bin/env bash
# DSHwork macOS 构建脚本(需要在 macOS 上运行)
# 会在打完 .app 后,借 afterPack 钩子自动把 mac 版 node + mac 版 harness 灌进 app,
# 产出 zip 便携包 + dmg。
#
# 用法(在 desktop 目录下): bash scripts/build-mac.sh
#
# 注意:
#   - 必须在 macOS 上跑(可能需要网络下载 mac 版 Electron/node/harness;可设镜像
#     DSHWORK_NODE_DIST_MIRROR / DSHWORK_NPM_REGISTRY)。
#   - 若 vendoring 失败,会回退为「用系统 node/npx 启动」的轻量模式。
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[1/3] 安装依赖..."
npm install

echo "[2/3] 构建 macOS(zip + dmg;afterPack 自动 vendor mac node + harness)..."
npm run build:mac

echo "[3/3] 完成!产物在 dist/ 下:"
echo "  - DSHwork-<version>-mac-<arch>.zip  便携压缩包"
echo "  - DSHwork-<version>.dmg            安装镜像"
