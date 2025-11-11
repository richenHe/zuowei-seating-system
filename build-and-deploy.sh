#!/bin/bash

# 座位管理系统 - 开发环境构建和部署脚本
# 用于在开发环境中完成构建，然后可以直接使用 entrypoint.sh 启动

set -e  # 遇到错误立即退出

echo "🚀 开始构建座位管理系统..."
echo "📅 构建时间: $(date)"
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
    if [ -f "production.env.template" ]; then
        echo "📋 使用生产环境配置模板..."
        cp production.env.template .env
        echo "⚠️ 请编辑 .env 文件填入正确的数据库配置！"
        echo "💡 注意：不要在 .env 文件中设置 NODE_ENV，构建时会自动处理"
    else
        echo "⚠️ 未找到环境配置文件和模板"
        echo "💡 请手动创建 .env 文件"
    fi
fi

# 检查必需的入口文件
if [ ! -f "index.html" ]; then
    echo "❌ 缺少 Vite 入口文件：index.html"
    echo "💡 请确保项目根目录有 index.html 文件"
    exit 1
fi

# 清理旧的构建文件
echo "🧹 清理旧的构建文件..."
rm -rf dist dist-server

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

echo "🎉 构建成功完成！"
echo "📋 构建产物："
echo "  ├── dist/          (前端构建产物)"
echo "  └── dist-server/   (后端构建产物)"
echo ""
echo "🚀 现在可以使用以下命令启动应用："
echo "   bash entrypoint.sh"
echo ""
echo "🌐 或者直接运行："
echo "   NODE_ENV=production node dist-server/server/index.js"
