#!/bin/bash

# 座位管理系统快速部署脚本
# 适用于已安装 Node.js 的环境

echo "🚀 座位管理系统 - 快速部署"
echo "================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js，请先安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查环境配置
if [ ! -f ".env" ]; then
    if [ -f "production.env.template" ]; then
        echo "📋 创建环境配置文件..."
        cp production.env.template .env
        echo "⚠️ 请编辑 .env 文件配置数据库连接！"
        echo "📍 数据库配置位置: .env"
        echo "💡 示例内网配置: DB_HOST=127.0.0.1"
        
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "🛑 部署已取消"
            exit 1
        fi
    else
        echo "❌ 未找到环境配置模板"
        exit 1
    fi
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ ! -d "dist" ] || [ ! -d "dist-server" ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建完成！"

# 启动服务
echo "🚀 启动服务..."
echo "📡 服务地址: http://0.0.0.0:3000"
echo "🔍 健康检查: http://0.0.0.0:3000/api/health"
echo "================================"

npm run start:prod
