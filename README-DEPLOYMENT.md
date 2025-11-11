# 🚀 座位管理系统部署指南

> 基于Vue 3 + Express.js的全栈座位管理系统，支持DevBox一键部署

## 📋 部署清单

### ✅ 已完成的部署配置
- [x] 数据库配置改为内网连接
- [x] 创建生产环境配置文件
- [x] 编写自动化部署脚本
- [x] 配置Docker容器化部署
- [x] 添加健康检查和监控
- [x] 编写完整部署文档

## 🎯 快速部署（推荐）

### DevBox环境一键部署
```bash
# 在DevBox中执行
bash entrypoint.sh
```

这将自动完成：
- ✅ 环境检查
- 📦 依赖安装  
- 🔨 项目构建
- 🔗 数据库连接测试
- 🚀 服务启动

## 🗄️ 数据库配置

### 内网PostgreSQL设置

1. **创建数据库**：
```bash
# 方法1: 使用SQL脚本
psql -U postgres -f init-db.sql

# 方法2: 手动创建
createdb -U postgres zuowei_db
```

2. **配置连接信息**：
```bash
# 复制环境配置模板
cp production.env.template .env

# 编辑配置文件
nano .env
```

3. **内网连接配置示例**：
```env
DB_HOST=127.0.0.1          # 内网数据库IP
DB_PORT=5432               # 默认PostgreSQL端口
DB_NAME=zuowei_db          # 数据库名
DB_USER=postgres           # 用户名
DB_PASSWORD=your_password   # 密码
DB_SSL=false              # 内网不需要SSL
```

## 🛠️ 部署方式选择

### 方式1: 标准部署（推荐）
```bash
bash entrypoint.sh
```

### 方式2: 简化部署
```bash
bash deploy.sh
```

### 方式3: NPM脚本
```bash
npm run deploy
```

### 方式4: Docker部署
```bash
# 构建镜像
docker build -t zuowei-app .

# 运行容器
docker run -d -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  zuowei-app
```

## 📊 验证部署

部署完成后访问以下地址：

- **🏠 应用首页**: http://your-server:3000
- **🩺 健康检查**: http://your-server:3000/api/health  
- **📡 API测试**: http://your-server:3000/api/config

健康检查返回示例：
```json
{
  "success": true,
  "message": "排座位表系统运行正常",
  "database": "已连接",
  "version": "1.0.0"
}
```

## 🔧 配置说明

### 环境变量配置
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | production |
| `PORT` | 服务端口 | 3000 |
| `DB_HOST` | 数据库地址 | localhost |
| `DB_PORT` | 数据库端口 | 5432 |
| `DB_NAME` | 数据库名 | zuowei_db |
| `DB_SSL` | SSL连接 | false |

### 系统要求
- **Node.js**: 18.x+
- **PostgreSQL**: 12+  
- **内存**: 1GB+
- **磁盘**: 2GB+

## 🚨 常见问题

### 问题1: 数据库连接失败
**解决方案**:
```bash
# 检查PostgreSQL服务
sudo systemctl status postgresql

# 检查端口占用
netstat -tulpn | grep :5432

# 测试连接
psql -h 127.0.0.1 -U postgres -d zuowei_db
```

### 问题2: 端口3000被占用
**解决方案**:
```bash
# 查看占用进程
netstat -tulpn | grep :3000

# 修改端口
export PORT=3001
```

### 问题3: 构建失败
**解决方案**:
```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 检查Node.js版本
node -v  # 需要18.x+
```

## 📈 性能优化

### 生产环境建议
- CPU: 2核+
- 内存: 2GB+
- 磁盘: SSD 10GB+
- 网络: 内网100Mbps+

### 数据库优化
- 连接池: 最大20连接
- 查询缓存: 启用
- 定期备份: 每日自动

## 📞 技术支持

如遇部署问题，请检查：
1. 📋 系统要求是否满足
2. 🔗 数据库连接配置
3. 📝 应用日志错误信息
4. 🌐 网络连通性测试

---

**DevBox部署**: 代码编写完成，一键部署上线 🚀
