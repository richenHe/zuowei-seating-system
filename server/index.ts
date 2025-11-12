import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, initializeDatabase, closeDatabase } from './config/database.js';

// 路由导入
import configRoutes from './routes/config.js';        // 配置管理路由
import personsRoutes from './routes/persons.js';      // 人员管理路由
import ambassadorsRoutes from './routes/ambassadors.js'; // 传播大使管理路由
import assignmentsRoutes from './routes/assignments.js'; // 座位分配路由
import exportRoutes from './routes/export.js';        // 导出功能路由

// 获取当前文件目录（ES模块兼容）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建Express应用
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// 中间件配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false  // 生产环境同源，不需要CORS
    : ['http://localhost:5173', 'http://127.0.0.1:5173'], // 开发环境允许Vite访问
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));       // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// API路由
app.use('/api/config', configRoutes);           // 配置相关API
app.use('/api/persons', personsRoutes);         // 人员管理API
app.use('/api/ambassadors', ambassadorsRoutes); // 传播大使管理API
app.use('/api/assignments', assignmentsRoutes); // 座位分配API
app.use('/api/export', exportRoutes);           // 导出功能API

// 健康检查接口
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      success: true,
      message: '排座位表系统运行正常',
      timestamp: new Date().toISOString(),
      database: dbConnected ? '已连接' : '连接失败',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '系统检查失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 生产环境静态文件服务
if (process.env.NODE_ENV === 'production') {
  // 服务前端打包后的静态文件 - 修复编译后的路径问题
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));
  
  // SPA路由处理 - 所有非API路由都返回index.html
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(404).json({
        success: false,
        error: 'API接口不存在'
      });
    }
  });
} else {
  // 开发环境根路由
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: '排座位表系统后端服务',
      mode: 'development',
      frontend: 'http://localhost:5173',
      api: `http://localhost:${PORT}/api`,
      health: `http://localhost:${PORT}/api/health`
    });
  });
}

// 404错误处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.url
  });
});

// 全局错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
  });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    console.log('🔗 测试数据库连接...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    // 初始化数据库表结构
    console.log('🗄️ 初始化数据库结构...');
    await initializeDatabase();

    // 启动HTTP服务器 - 监听所有网络接口以支持容器部署
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 排座位表系统启动成功！`);
      console.log(`📡 后端服务: http://0.0.0.0:${PORT}`);
      console.log(`🔍 健康检查: http://0.0.0.0:${PORT}/api/health`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log(`🌐 前端页面: http://0.0.0.0:${PORT}`);
      } else {
        console.log(`🛠️ 前端开发: http://localhost:5173`);
      }
      
      console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('------------------------------------');
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  console.log('\n📴 正在关闭服务器...');
  try {
    await closeDatabase();
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭服务器时出错:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n📴 收到终止信号，正在关闭服务器...');
  try {
    await closeDatabase();
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 关闭服务器时出错:', error);
    process.exit(1);
  }
});

// 启动应用
startServer();
