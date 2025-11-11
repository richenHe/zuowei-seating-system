# 🪑 排座位表系统

一个轻量级的前后端一体排座位Web应用，支持圆桌环形座位布局、拖拽编辑、人员管理等功能。

![项目预览](https://img.shields.io/badge/状态-开发完成-brightgreen)
![技术栈](https://img.shields.io/badge/技术栈-Vue3+Express+PostgreSQL-blue)
![部署方式](https://img.shields.io/badge/部署-DevBox-orange)

## ✨ 功能特点

### 🎯 核心功能
- **圆桌环形座位布局** - 基于真实圆桌的座位排列，支持4-12座位/桌
- **拖拽编辑** - 直观的拖拽交互，座位间可互相交换或移至备选区
- **人员管理** - 添加、编辑、删除人员信息，支持姓名、学号、备注等
- **备选区域** - 未分配座位的人员暂存区，支持拖拽分配
- **实时保存** - 拖拽操作实时同步到数据库，无需手动保存

### 🎨 界面特色
- **现代化UI** - 基于shadcn-vue组件库，简洁美观
- **响应式设计** - 完美适配桌面、平板、手机等设备
- **动画效果** - 流畅的拖拽动画和状态转换
- **悬停提示** - 鼠标悬停显示人员详细信息

### ⚙️ 系统特性
- **前后端一体** - 单项目统一管理，开发部署简便
- **类型安全** - 全栈TypeScript，减少运行时错误
- **数据持久化** - PostgreSQL数据库存储，支持并发访问
- **错误处理** - 内置错误监控和异常处理机制

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 12+
- 现代浏览器（支持ES2020）

### 开发环境启动

1. **克隆项目**
```bash
git clone <repository-url>
cd zuowei
```

2. **安装依赖**
```bash
npm install
```

3. **配置数据库**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置PostgreSQL连接信息
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zuowei_db
DB_USER=your_username
DB_PASSWORD=your_password
NODE_ENV=development
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
- 前端开发服务：http://localhost:5173
- 后端API服务：http://localhost:3000
- 健康检查：http://localhost:3000/api/health

### DevBox部署

1. **准备部署**
```bash
# 确保代码已推送到仓库
git add .
git commit -m "部署排座位表系统"
git push origin main
```

2. **DevBox环境配置**
- 容器暴露端口：`3000`
- 公网访问：`开启`
- 环境变量：配置PostgreSQL连接信息

3. **启动部署**
```bash
# 在DevBox终端中运行
bash entrypoint.sh
```

## 📁 项目结构

```
zuowei/                         # 项目根目录
├── server/                     # 后端Express服务
│   ├── config/
│   │   └── database.ts         # 数据库连接配置
│   ├── routes/
│   │   ├── config.ts           # 配置管理API
│   │   ├── persons.ts          # 人员管理API
│   │   └── assignments.ts      # 座位分配API
│   ├── models/
│   │   └── types.ts            # 类型定义
│   └── index.ts                # Express应用入口
│
├── src/                        # 前端Vue应用
│   ├── components/             # Vue组件
│   │   ├── ConfigPanel.vue     # 配置面板
│   │   ├── PersonManager.vue   # 人员管理
│   │   ├── SeatingArea.vue     # 座位区域
│   │   └── WaitingArea.vue     # 备选区域
│   ├── composables/            # 组合函数
│   │   └── useDragAndDrop.ts   # 拖拽功能
│   ├── utils/                  # 工具函数
│   │   └── seatLayout.ts       # 座位布局算法
│   ├── api/                    # API调用封装
│   ├── types/                  # TypeScript类型
│   ├── App.vue                 # 主应用组件
│   └── main.ts                 # 应用入口
│
├── public/                     # 静态资源
├── dist/                       # 前端构建输出
├── package.json                # 项目配置和依赖
├── vite.config.ts              # Vite配置
├── tailwind.config.js          # Tailwind CSS配置
├── entrypoint.sh               # DevBox启动脚本
└── README.md                   # 项目文档
```

## 🛠️ 技术架构

### 前端技术栈
- **Vue 3** - 现代化前端框架，组合式API
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 快速的前端构建工具
- **Tailwind CSS** - 原子化CSS框架
- **Axios** - HTTP客户端，API调用
- **原生拖拽API** - 轻量级拖拽实现

### 后端技术栈
- **Node.js** - JavaScript运行时环境
- **Express.js** - 轻量级Web框架
- **PostgreSQL** - 企业级关系数据库
- **node-postgres** - PostgreSQL驱动
- **TypeScript** - 类型安全开发
- **dotenv** - 环境变量管理

### 开发工具
- **concurrently** - 同时运行前后端服务
- **tsx** - TypeScript执行器
- **PostCSS** - CSS后处理器
- **ESLint + Prettier** - 代码规范和格式化

## 📊 数据库设计

### 表结构

**config - 配置表**
```sql
CREATE TABLE config (
  id SERIAL PRIMARY KEY,
  desk_count INTEGER NOT NULL,              -- 桌子数量
  seats_per_desk INTEGER NOT NULL,          -- 每桌座位数
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**persons - 人员表**
```sql
CREATE TABLE persons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,               -- 姓名
  student_id VARCHAR(50),                   -- 学号/工号
  info TEXT,                                -- 其他信息
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**seat_assignments - 座位分配表**
```sql
CREATE TABLE seat_assignments (
  id SERIAL PRIMARY KEY,
  person_id INTEGER REFERENCES persons(id) ON DELETE CASCADE,
  desk_number INTEGER,                      -- 桌号（NULL表示在备选区）
  seat_number INTEGER,                      -- 座位号（NULL表示在备选区）
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(desk_number, seat_number)          -- 每个座位只能坐一人
);
```

## 🎮 使用指南

### 基本操作

1. **配置座位布局**
   - 在左侧配置面板设置桌子数量（1-50桌）
   - 设置每桌座位数（4-12座位）
   - 点击"应用配置"生效

2. **管理人员信息**
   - 在右上方"人员管理"区域添加人员
   - 填写姓名（必填）、学号、备注信息
   - 支持编辑和删除已有人员

3. **拖拽分配座位**
   - 从备选区拖拽人员到座位上
   - 座位间可以互相拖拽交换
   - 拖拽座位到备选区可清空座位

4. **查看座位信息**
   - 鼠标悬停座位查看详细信息
   - 右下方显示座位统计数据

### 高级功能

- **随机分配** - 备选区提供随机排座功能
- **批量操作** - 支持选择多人进行批量操作
- **状态反馈** - 实时显示操作状态和错误信息
- **自动保存** - 拖拽操作自动同步到数据库

## 🔧 开发指南

### 本地开发

```bash
# 开发模式（前后端同时启动）
npm run dev

# 仅构建前端
npm run build:client

# 仅构建后端
npm run build:server

# 生产模式启动
npm run start
```

### 环境变量

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zuowei_db
DB_USER=postgres
DB_PASSWORD=password

# 服务配置
PORT=3000
NODE_ENV=development
```

### API接口

#### 配置管理
- `GET /api/config` - 获取当前配置
- `PUT /api/config` - 更新配置

#### 人员管理
- `GET /api/persons` - 获取所有人员
- `POST /api/persons` - 添加人员
- `PUT /api/persons/:id` - 更新人员
- `DELETE /api/persons/:id` - 删除人员

#### 座位分配
- `GET /api/assignments/layout` - 获取座位布局
- `PUT /api/assignments` - 批量更新座位分配

#### 系统监控
- `GET /api/health` - 健康检查

## 🐛 故障排除

### 常见问题

**1. 数据库连接失败**
```bash
# 检查PostgreSQL服务状态
sudo service postgresql status

# 检查数据库是否存在
psql -U postgres -l
```

**2. 端口冲突**
```bash
# 检查端口占用
lsof -i :3000
lsof -i :5173

# 修改端口配置
export PORT=3001
```

**3. 前端构建失败**
```bash
# 清理node_modules重新安装
rm -rf node_modules package-lock.json
npm install

# 清理构建缓存
rm -rf dist .vite
```

### 调试技巧

- 开启浏览器开发者工具查看网络请求
- 查看后端控制台日志定位API错误
- 使用`/api/health`检查系统整体状态

## 🤝 贡献指南

1. Fork 项目到你的GitHub
2. 创建特性分支 `git checkout -b feature/amazing-feature`
3. 提交变更 `git commit -m '添加某个很棒的特性'`
4. 推送到分支 `git push origin feature/amazing-feature`
5. 创建Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Express.js](https://expressjs.com/) - 快速、极简的Web框架
- [PostgreSQL](https://www.postgresql.org/) - 世界上最先进的开源数据库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- [DevBox](https://devbox.sealos.io/) - 便捷的云端开发部署平台

---

**💡 提示**: 如果你觉得这个项目对你有帮助，请给它一个 ⭐ Star！
