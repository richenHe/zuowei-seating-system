#!/bin/bash

# 座位管理系统启动脚本
# 适用于 Sealos DevBox 环境 - 支持测试和生产环境部署
# 使用方法: bash entrypoint.sh [development|production]
# 默认: production

set -e  # 遇到错误立即退出

# 获取环境参数（第一个参数）
ENV_MODE=${1:-production}

echo "🚀 启动座位管理系统..."
echo "📅 启动时间: $(date)"
echo "📍 当前目录: $(pwd)"
echo "🌍 部署环境: $ENV_MODE"

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
    if [ "$ENV_MODE" = "development" ] && [ -f "development.env" ]; then
        echo "📋 使用开发/测试环境配置"
        cp development.env .env
        echo "✅ 开发环境配置已设置"
    elif [ "$ENV_MODE" = "production" ] && [ -f "production.env" ]; then
        echo "📋 使用生产环境配置"
        cp production.env .env
        echo "✅ 生产环境配置已设置"
    else
        echo "⚠️ 未找到对应的环境配置文件"
        echo "💡 请确保存在 development.env 或 production.env 文件"
        exit 1
    fi
else
    echo "✅ 发现现有 .env 文件"
fi

# 根据环境模式设置 NODE_ENV
if [ "$ENV_MODE" = "development" ]; then
    export NODE_ENV=development
    echo "🔧 运行模式: 开发/测试环境"
    echo "📊 数据库将连接: dbconn.sealoshzh.site:39174"
else
    export NODE_ENV=production
    echo "🔧 运行模式: 生产环境"
    echo "📊 数据库将连接: zuowei-postgresql.ns-9z2wbi7z.svc:5432"
fi

# 启动应用
echo "🚀 启动座位管理系统..."
echo "📡 服务端口: ${PORT:-3000}"
echo "🌐 访问地址: http://0.0.0.0:${PORT:-3000}"
echo "🔍 健康检查: http://0.0.0.0:${PORT:-3000}/api/health"
echo "------------------------------------"

# 直接启动预构建的应用
exec node dist-server/server/index.js
