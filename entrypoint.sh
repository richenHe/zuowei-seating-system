#!/bin/bash

# 座位管理系统启动脚本
# 适用于 Sealos DevBox 环境 - 遵循最佳实践，只负责启动应用

set -e  # 遇到错误立即退出

echo "🚀 启动座位管理系统..."
echo "📅 启动时间: $(date)"
echo "📍 当前目录: $(pwd)"

# 检查必需的构建产物
if [ ! -d "dist" ]; then
    echo "❌ 前端构建产物不存在：dist 目录"
    echo "💡 请在开发环境中先运行: npm run build"
    exit 1
fi

if [ ! -d "dist-server" ]; then
    echo "❌ 后端构建产物不存在：dist-server 目录"
    echo "💡 请在开发环境中先运行: npm run build"
    exit 1
fi

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查和创建环境配置文件
if [ ! -f ".env" ]; then
    if [ -f "server.env" ]; then
        echo "📋 使用服务器配置 server.env"
        cp server.env .env
        echo "✅ 环境配置已设置"
    else
        echo "⚠️ 未找到环境配置文件"
        echo "💡 应用将使用代码中的默认配置"
    fi
fi

# 设置生产环境
export NODE_ENV=production

# 启动应用
echo "🚀 启动座位管理系统..."
echo "📡 服务端口: ${PORT:-3000}"
echo "🌐 访问地址: http://0.0.0.0:${PORT:-3000}"
echo "🔍 健康检查: http://0.0.0.0:${PORT:-3000}/api/health"
echo "------------------------------------"

# 直接启动预构建的应用
exec node dist-server/server/index.js



