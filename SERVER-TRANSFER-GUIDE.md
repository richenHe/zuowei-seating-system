# 🚀 服务器项目转移和部署指南

## 📁 项目文件转移

### 方法1: 使用 Git（推荐）
```bash
# 在服务器上克隆项目
cd /path/to/your/projects
git clone https://github.com/your-username/zuowei-seating-system.git
cd zuowei-seating-system

# 如果项目已存在，拉取最新代码
git pull origin main
```

### 方法2: 使用 SCP/SFTP 传输
```bash
# 从本地上传项目到服务器
scp -r /path/to/zuowei-project username@server-ip:/path/to/destination/

# 或使用 rsync（排除不必要文件）
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  /path/to/zuowei-project/ username@server-ip:/path/to/destination/
```

### 方法3: 使用压缩包传输
```bash
# 本地打包项目
tar -czf zuowei-project.tar.gz . --exclude=node_modules --exclude=dist --exclude=.git

# 上传到服务器
scp zuowei-project.tar.gz username@server-ip:/path/to/destination/

# 在服务器上解压
ssh username@server-ip
cd /path/to/destination
tar -xzf zuowei-project.tar.gz
```

## 🔧 服务器环境准备

### 1. 检查系统环境
```bash
# 检查系统版本
cat /etc/os-release

# 检查Node.js版本
node -v
npm -v

# 如果没有Node.js，安装它
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 检查PostgreSQL
```bash
# 检查PostgreSQL服务状态
sudo systemctl status postgresql

# 如果未安装PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 启动PostgreSQL服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. 配置数据库
```bash
# 切换到postgres用户
sudo -u postgres psql

# 在PostgreSQL中执行
CREATE DATABASE zuowei_db;
CREATE USER zuowei_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE zuowei_db TO zuowei_user;
\q
```

## 🚀 项目部署步骤

### 1. 进入项目目录
```bash
cd /path/to/zuowei-seating-system
ls -la  # 确认文件已转移完整
```

### 2. 配置环境变量
```bash
# 复制环境配置模板
cp production.env.template .env

# 编辑配置文件
nano .env
```

**重要：内网数据库配置**
```env
NODE_ENV=production
PORT=3000

# 内网数据库配置
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=zuowei_db
DB_USER=zuowei_user          # 或 postgres
DB_PASSWORD=your_secure_password
DB_SSL=false

# 连接池配置
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
```

### 3. 执行一键部署
```bash
# 给脚本执行权限
chmod +x entrypoint.sh
chmod +x deploy.sh

# 执行部署（推荐使用entrypoint.sh）
bash entrypoint.sh

# 或使用简化脚本
# bash deploy.sh
```

### 4. 手动部署（如脚本失败）
```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务
npm run start:prod
```

## 🔍 部署验证

### 1. 检查服务状态
```bash
# 检查进程是否运行
ps aux | grep node

# 检查端口占用
netstat -tulpn | grep :3000

# 检查服务日志
journalctl -u zuowei-app -f
```

### 2. 测试应用访问
```bash
# 本地测试
curl http://localhost:3000/api/health

# 远程测试（替换为实际服务器IP）
curl http://your-server-ip:3000/api/health
```

### 3. 浏览器访问测试
- **应用首页**: http://your-server-ip:3000
- **健康检查**: http://your-server-ip:3000/api/health
- **API测试**: http://your-server-ip:3000/api/config

## 🛠️ 服务管理

### 创建系统服务（可选）
```bash
# 创建服务文件
sudo nano /etc/systemd/system/zuowei-app.service
```

服务文件内容：
```ini
[Unit]
Description=Zuowei Seating System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/zuowei-seating-system
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist-server/server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable zuowei-app
sudo systemctl start zuowei-app
sudo systemctl status zuowei-app
```

## 🔥 常见问题解决

### 1. 端口被占用
```bash
# 查看占用进程
sudo lsof -i :3000

# 杀死占用进程
sudo kill -9 PID

# 或更换端口
export PORT=3001
```

### 2. 数据库连接失败
```bash
# 检查数据库服务
sudo systemctl status postgresql

# 检查数据库连接
psql -h 127.0.0.1 -U zuowei_user -d zuowei_db

# 检查防火墙
sudo ufw status
sudo ufw allow 5432  # 如果需要
```

### 3. 权限问题
```bash
# 修改文件权限
chmod +x entrypoint.sh deploy.sh
chown -R $USER:$USER /path/to/project

# NPM权限问题
sudo chown -R $(whoami) ~/.npm
```

### 4. 内存不足
```bash
# 检查内存使用
free -h
htop

# 如果内存不足，创建swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 🔐 安全配置

### 1. 防火墙配置
```bash
# 配置UFW防火墙
sudo ufw enable
sudo ufw allow 22      # SSH
sudo ufw allow 3000    # 应用端口
sudo ufw allow 5432    # PostgreSQL（仅内网需要）
```

### 2. 反向代理（可选）
```bash
# 安装Nginx
sudo apt install nginx

# 配置Nginx反向代理
sudo nano /etc/nginx/sites-available/zuowei-app
```

Nginx配置示例：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 监控命令

```bash
# 实时监控
htop                           # 系统资源
sudo netstat -tulpn           # 网络连接
sudo systemctl status zuowei-app  # 服务状态

# 日志查看
tail -f /var/log/nginx/access.log    # Nginx访问日志
journalctl -u zuowei-app -f         # 应用日志
sudo tail -f /var/log/postgresql/postgresql-*.log  # 数据库日志
```

---

**🎉 现在您可以开始项目转移和部署了！**

建议顺序：项目传输 → 环境配置 → 数据库设置 → 执行部署 → 验证访问
