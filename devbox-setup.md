# DevBox 部署说明

## 快速部署

### 方法1: 使用 entrypoint.sh（推荐）
```bash
# 在 DevBox 中执行
bash entrypoint.sh
```

### 方法2: 使用简化脚本
```bash
# 给脚本执行权限（Linux）
chmod +x deploy.sh

# 执行部署
bash deploy.sh
```

### 方法3: 手动部署
```bash
# 1. 配置环境变量
cp production.env.template .env
# 编辑 .env 文件设置数据库连接

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 启动服务
npm run start:prod
```

## 内网数据库配置

编辑 `.env` 文件，设置内网连接：

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=zuowei_db
DB_USER=postgres
DB_PASSWORD=your_internal_password
DB_SSL=false
```

## 验证部署

访问 http://your-server:3000/api/health 检查服务状态

## 注意事项

- 确保内网数据库服务正在运行
- 检查端口 3000 是否可用
- 数据库会自动创建必要的表结构
