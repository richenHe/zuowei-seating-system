# 座位管理系统 - DevBox 部署指南

这是一个基于 Vue 3 + TypeScript + Express.js 的全栈座位管理系统，支持内网PostgreSQL数据库连接。

## 项目描述

本项目是一个智能座位管理系统，提供以下功能：
- 🪑 动态座位配置和管理
- 👥 人员信息管理
- 🎯 传播大使系统
- 🔄 拖拽式座位分配
- 📱 响应式界面设计

系统采用前后端分离架构，前端使用Vue 3构建，后端使用Express.js提供API服务，数据存储使用PostgreSQL数据库。

## 环境要求

本项目运行在 Debian 12 系统上，已在 Devbox 环境中预配置了 Node.js。你不需要担心设置 Node.js 或系统依赖项。开发环境包含构建和运行 Node.js 应用程序的所有必要工具。

**重要更新**: 数据库连接已配置为内网连接模式，外网连接已关闭以提高安全性。

## 项目部署

### 快速部署（推荐）
在 Devbox 环境中，直接运行以下命令：
```bash
bash entrypoint.sh
```

### 手动部署步骤
如需手动控制部署过程：

1. **配置数据库连接**：
```bash
# 复制环境配置模板
cp production.env.template .env

# 编辑配置文件，设置内网数据库连接
# DB_HOST=127.0.0.1
# DB_PORT=5432  
# DB_NAME=zuowei_db
# DB_PASSWORD=your_internal_password
```

2. **执行部署**：
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动生产服务
npm run start:prod
```

### Docker 部署（可选）
项目也支持容器化部署：
```bash
# 构建镜像
docker build -t zuowei-seating-system .

# 运行容器
docker run -d -p 3000:3000 \
  -e DB_HOST=内网数据库IP \
  zuowei-seating-system
```

## 部署验证

部署成功后，系统将在端口 3000 上运行：
- **应用首页**: http://0.0.0.0:3000
- **健康检查**: http://0.0.0.0:3000/api/health
- **API接口**: http://0.0.0.0:3000/api/*

在 Devbox 中，你只需专注于开发 - 你可以相信一切都已准备就绪 XD

## 内网数据库配置

系统已配置为使用内网PostgreSQL连接：
- 默认连接地址：127.0.0.1:5432
- SSL连接：已禁用（内网环境更安全）
- 连接池：优化配置，支持最大20个并发连接
- 自动初始化：首次运行时自动创建数据库表结构

---

**DevBox: Code. Build. Deploy. We've Got the Rest.**

使用 DevBox，你可以完全专注于编写优秀的代码，而我们负责处理基础设施、扩展和部署。从开始到生产的无缝开发体验。 