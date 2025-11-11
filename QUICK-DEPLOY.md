# ⚡ 座位管理系统 - 快速部署卡片

## 🚀 一键部署（DevBox）

```bash
bash entrypoint.sh
```

## 🔧 手动部署

```bash
# 1. 配置内网数据库
cp production.env.template .env
# 编辑 .env 文件设置: DB_HOST=127.0.0.1

# 2. 安装构建启动
npm install && npm run build && npm run start:prod
```

## 📍 访问地址

- **应用**: http://localhost:3000
- **健康检查**: http://localhost:3000/api/health

## 🗄️ 内网数据库配置

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=zuowei_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

## 🆘 快速故障排除

```bash
# 检查数据库
sudo systemctl status postgresql

# 检查端口
netstat -tulpn | grep :3000

# 重启服务
sudo systemctl restart zuowei-app
```

---
**DevBox部署**: 代码写完，一键上线 ✨
