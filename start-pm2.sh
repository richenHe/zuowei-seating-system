#!/bin/bash

echo "🚀 使用 PM2 启动座位管理系统..."

# 创建日志目录
mkdir -p logs

# 检查是否已构建
if [ ! -d "dist-server" ]; then
    echo "📦 正在构建项目..."
    npm run build
fi

# 检查环境配置
if [ ! -f ".env" ]; then
    if [ -f "server.env" ]; then
        echo "📋 复制服务器配置..."
        cp server.env .env
    fi
fi

# 停止已有进程（如果存在）
pm2 stop zuowei-seating-system 2>/dev/null || true
pm2 delete zuowei-seating-system 2>/dev/null || true

# 启动应用
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启（可选）
pm2 startup

echo "✅ 应用已启动！"
echo "📊 查看状态: pm2 status"
echo "📋 查看日志: pm2 logs zuowei-seating-system"
echo "🔄 重启应用: pm2 restart zuowei-seating-system"
echo "⏹️  停止应用: pm2 stop zuowei-seating-system"
