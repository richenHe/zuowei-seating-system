#!/bin/bash

# 座位管理系统部署脚本
# 适用于 DevBox 环境的自动化部署

set -e  # 遇到错误立即退出

echo "🚀 开始部署座位管理系统..."
echo "📅 部署时间: $(date)"
echo "🖥️ 系统信息: $(uname -a)"
echo "📍 当前目录: $(pwd)"

# 检查 Node.js 环境
echo "🔍 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "✅ Node.js 版本: $NODE_VERSION"
echo "✅ NPM 版本: $NPM_VERSION"

# 检查环境变量配置
echo "🔧 检查环境配置..."
if [ ! -f ".env" ]; then
    if [ -f ".env.production" ]; then
        echo "📋 使用生产环境配置..."
        cp .env.production .env
    else
        echo "⚠️ 未找到环境配置文件，使用示例配置..."
        cp .env.example .env
        echo "⚠️ 请编辑 .env 文件填入正确的数据库配置！"
    fi
fi

# 安装依赖
echo "📦 安装项目依赖..."
if [ -f "package-lock.json" ]; then
    npm ci --production=false
else
    npm install
fi

# 构建项目
echo "🔨 构建项目..."
echo "📦 构建前端..."
npm run build:client

echo "📦 构建后端..."
npm run build:server

echo "✅ 项目构建完成！"

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 前端构建失败：dist 目录不存在"
    exit 1
fi

if [ ! -d "dist-server" ]; then
    echo "❌ 后端构建失败：dist-server 目录不存在"
    exit 1
fi

# 数据库连接测试（可选）
echo "🔗 测试数据库连接..."
if [ "$DB_HOST" != "" ]; then
    echo "📍 数据库主机: $DB_HOST:$DB_PORT"
    echo "📊 数据库名称: $DB_NAME"
    
    # 简单的连接测试
    timeout 10 bash -c "</dev/tcp/$DB_HOST/$DB_PORT" 2>/dev/null && echo "✅ 数据库端口可达" || echo "⚠️ 数据库连接测试超时（这在内网环境中可能是正常的）"
else
    echo "⚠️ 数据库配置不完整，请检查 .env 文件"
fi

# 设置生产环境
echo "🌍 设置生产环境..."
export NODE_ENV=production

# 启动应用
echo "🚀 启动座位管理系统..."
echo "📡 服务端口: ${PORT:-3000}"
echo "🌐 访问地址: http://0.0.0.0:${PORT:-3000}"
echo "🔍 健康检查: http://0.0.0.0:${PORT:-3000}/api/health"
echo "------------------------------------"

# 使用 node 直接运行构建后的服务器
exec node dist-server/server/index.js
