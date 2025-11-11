# 🪑 座位管理系统 

> 基于 Vue 3 + TypeScript + Express.js 的智能座位管理系统

## ✨ 功能特性

- 🪑 **动态座位管理** - 灵活配置桌数和座位数
- 👥 **人员信息管理** - 添加、编辑、删除人员信息
- 🎯 **传播大使系统** - 管理传播大使和关联人员
- 🔄 **拖拽式分配** - 直观的拖拽操作分配座位
- 📱 **响应式设计** - 支持桌面和移动设备
- 💾 **数据持久化** - PostgreSQL 数据库存储
- 🎨 **现代UI设计** - 基于 Tailwind CSS + shadcn-vue

## 🛠️ 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速构建工具
- **Tailwind CSS** - 实用优先的 CSS 框架
- **shadcn-vue** - 高质量的 Vue 组件库

### 后端
- **Node.js** - JavaScript 运行时
- **Express.js** - Web 应用框架
- **TypeScript** - 类型安全开发
- **PostgreSQL** - 关系型数据库

## 🚀 快速开始

### 环境要求
- Node.js 18.x+
- PostgreSQL 12+
- npm 或 yarn

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/your-username/zuowei-seating-system.git
cd zuowei-seating-system

# 安装依赖
npm install

# 配置环境变量
cp production.env.template .env
# 编辑 .env 文件配置数据库连接

# 开发模式运行
npm run dev

# 生产模式构建和运行
npm run build
npm run start:prod
```

### 数据库配置

编辑 `.env` 文件：

```env
# 数据库连接配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zuowei_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

## 📁 项目结构

```
zuowei-seating-system/
├── 📂 src/                    # 前端源代码
│   ├── 📂 components/         # Vue 组件
│   ├── 📂 composables/        # Vue Composables
│   ├── 📂 types/             # TypeScript 类型定义
│   ├── 📂 utils/             # 工具函数
│   └── 📂 api/               # API 接口
├── 📂 server/                 # 后端源代码
│   ├── 📂 routes/            # API 路由
│   ├── 📂 models/            # 数据模型
│   └── 📂 config/            # 配置文件
├── 📂 public/                 # 静态资源
├── 📄 package.json           # 项目配置
├── 📄 vite.config.ts         # Vite 配置
├── 📄 tailwind.config.js     # Tailwind 配置
└── 📄 tsconfig.json          # TypeScript 配置
```

## 🌐 部署指南

### 🚀 Sealos DevBox 部署（推荐）

**本项目已完全配置好 Sealos DevBox 一键部署！**

#### 准备工作
项目包含预配置的环境文件 `server.env`，包含正确的数据库连接信息。

#### 部署步骤

**1. 克隆项目到DevBox**
```bash
git clone https://github.com/richenHe/zuowei-seating-system.git
cd zuowei-seating-system
```

**2. 构建项目**
```bash
# 安装依赖
npm install

# 构建前端和后端
npm run build
```

**3. 启动应用**
```bash
# 使用Sealos标准启动脚本
bash entrypoint.sh
```

#### 验证部署
- 📡 健康检查: `http://your-domain/api/health`
- 🌐 应用访问: `http://your-domain`

### 📊 系统要求
- Node.js 18.x+
- PostgreSQL 12+（已配置内网连接）
- 内存: 1GB+

### 🔧 故障排除

**数据库连接问题：**
检查 `server.env` 文件是否存在，包含正确的数据库配置。

**端口占用：**
默认端口3000，可通过环境变量 `PORT` 修改。

**构建失败：**
确保 Node.js 版本 ≥ 18.0.0，删除 `node_modules` 重新安装。

## 🔗 API 接口

### 健康检查
```
GET /api/health
```

### 配置管理
```
GET    /api/config      # 获取系统配置
PUT    /api/config      # 更新系统配置
```

### 人员管理
```
GET    /api/persons     # 获取人员列表
POST   /api/persons     # 添加人员
PUT    /api/persons/:id # 更新人员信息
DELETE /api/persons/:id # 删除人员
```

### 座位分配
```
GET    /api/assignments    # 获取座位分配
POST   /api/assignments    # 分配座位
DELETE /api/assignments/:id # 取消分配
```

## 🎯 使用说明

### 1. 系统配置
- 在配置面板中设置桌数和每桌座位数
- 可选择4列布局显示模式
- 自定义桌布颜色

### 2. 人员管理
- 添加人员信息（姓名、备注）
- 关联传播大使
- 批量导入支持

### 3. 座位分配
- 拖拽人员到指定座位
- 自动保存分配结果
- 支持取消分配

## 🔧 开发指南

### 开发环境运行
```bash
# 启动开发服务器（前端 + 后端）
npm run dev

# 前端：http://localhost:5173
# 后端：http://localhost:3000
```

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 TypeScript 严格模式
- 组件使用 Composition API

### 构建和测试
```bash
# 代码检查
npm run lint

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 📄 许可证

MIT License

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📞 支持与反馈

如有问题或建议，欢迎：
- 提交 [Issues](https://github.com/your-username/zuowei-seating-system/issues)
- 发送邮件至：your-email@example.com

---

**🚀 让座位管理变得简单高效！**