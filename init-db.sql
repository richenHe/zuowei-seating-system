-- 座位管理系统数据库初始化脚本
-- 在 PostgreSQL 中执行此脚本来创建数据库和用户

-- 创建数据库
CREATE DATABASE zuowei_db
    WITH ENCODING 'UTF8'
    LC_COLLATE = 'zh_CN.UTF-8'
    LC_CTYPE = 'zh_CN.UTF-8'
    TEMPLATE = template0;

-- 切换到新数据库
\c zuowei_db;

-- 创建应用用户（如果需要）
-- CREATE USER zuowei_user WITH PASSWORD 'your_secure_password';

-- 赋予权限
-- GRANT ALL PRIVILEGES ON DATABASE zuowei_db TO zuowei_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO zuowei_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO zuowei_user;

-- 设置默认权限
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zuowei_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO zuowei_user;

-- 验证连接
SELECT 'Database zuowei_db created successfully!' as status;



