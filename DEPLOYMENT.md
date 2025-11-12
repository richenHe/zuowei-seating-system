# 🚀 座位管理系统部署方案

## 📋 环境配置说明

项目支持**测试环境**和**生产环境**两种部署模式，会根据 `NODE_ENV` 环境变量自动选择对应的数据库连接。

### 🔄 自动数据库切换

代码会根据 `NODE_ENV` 自动选择数据库：

| 环境 | NODE_ENV | 数据库地址 | 端口 | 说明 |
|------|----------|-----------|------|------|
| **开发/测试** | `development` | `dbconn.sealoshzh.site` | `39174` | 外网连接，用于本地开发或测试 |
| **生产** | `production` | `zuowei-postgresql.ns-9z2wbi7z.svc` | `5432` | 内网连接，用于生产环境 |

## 🧪 测试环境部署

### 方式1: 使用启动脚本（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/richenHe/zuowei-seating-system.git
cd zuowei-seating-system

# 2. 构建项目
npm install
npm run build

# 3. 启动测试环境
bash entrypoint.sh development
```

### 方式2: 直接启动

```bash
# 设置环境变量并启动
NODE_ENV=development node dist-server/server/index.js
```

### 验证测试环境

启动后查看日志，应该看到：
```
🌍 当前环境: 开发环境
📊 数据库连接: dbconn.sealoshzh.site:39174
```

## 🚀 生产环境部署（Sealos）

### Sealos 应用配置

#### 基础配置
- **应用名称:** `zuowei-release-xxx`
- **镜像:** `hub.hzh.sealos.run/ns-9z2wbi7z/zuowei:v1.0`
- **实例数:** `1`

#### 资源配置
- **CPU:** `2 Core`
- **内存:** `2G` (推荐)

#### 网络配置
- **容器端口:** `3000`
- **公网访问:** 开启
- **域名:** 自动分配或自定义

#### 启动配置
- **运行命令:** `node`
- **命令参数:** `/home/devbox/project/zuowei-seating-system/dist-server/server/index.js`

#### 环境变量配置

**必须设置的环境变量：**

```bash
NODE_ENV=production
PORT=3000
```

**可选环境变量：**

```bash
APP_NAME=座位管理系统
APP_VERSION=1.0.0
```

### 验证生产环境

部署成功后查看日志，应该看到：
```
🌍 当前环境: 生产环境
📊 数据库连接: zuowei-postgresql.ns-9z2wbi7z.svc:5432
✅ 数据库连接成功
```

## 📊 部署检查清单

### 测试环境
- [ ] `NODE_ENV=development` 已设置
- [ ] 日志显示连接 `dbconn.sealoshzh.site:39174`
- [ ] 数据库连接成功
- [ ] 应用可以正常访问

### 生产环境
- [ ] `NODE_ENV=production` 已设置
- [ ] 日志显示连接 `zuowei-postgresql.ns-9z2wbi7z.svc:5432`
- [ ] 数据库连接成功
- [ ] 公网域名可以访问
- [ ] 健康检查接口正常

## 🔧 故障排除

### 问题1: 数据库连接失败

**检查项：**
1. 确认 `NODE_ENV` 环境变量设置正确
2. 查看日志确认连接的是哪个数据库地址
3. 测试环境检查外网连接是否正常
4. 生产环境检查内网服务是否可达

### 问题2: 环境变量未生效

**解决方案：**
- 在 Sealos 应用配置中明确设置 `NODE_ENV`
- 不要依赖 `.env` 文件，使用环境变量配置

### 问题3: 端口冲突

**解决方案：**
- 修改环境变量 `PORT=3001` 或其他可用端口
- 更新容器端口配置

## 📝 配置文件说明

| 文件 | 用途 | 使用场景 |
|------|------|----------|
| `development.env` | 开发/测试环境配置 | 本地开发或测试部署 |
| `production.env` | 生产环境配置 | Sealos生产环境部署 |

## 🎯 最佳实践

1. **测试环境**：使用 `development.env` 或设置 `NODE_ENV=development`
2. **生产环境**：在 Sealos 中直接设置 `NODE_ENV=production`
3. **不要混用**：确保环境变量设置正确，避免连接错误的数据库
4. **查看日志**：启动时查看日志确认连接的是正确的数据库地址

---

**现在您可以轻松地在测试和生产环境之间切换了！** 🎉
