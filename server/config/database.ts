import { Pool } from 'pg';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// PostgreSQL数据库连接配置 - 支持内网和外网连接
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'zuowei_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // SSL配置（根据环境变量决定是否启用）
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false    // 允许自签名证书
  } : false,
  // 连接池配置
  max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),                    // 最大连接数
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),     // 空闲超时时间
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'), // 连接超时时间（内网连接更快）
};

// 创建连接池
export const pool = new Pool(dbConfig);

// 数据库连接测试
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ 数据库连接成功:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

// 初始化数据库表结构
export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // 创建config表
    await client.query(`
      CREATE TABLE IF NOT EXISTS config (
        id SERIAL PRIMARY KEY,
        desk_count INTEGER NOT NULL,
        seats_per_desk INTEGER NOT NULL,
        display_columns INTEGER DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 检查并添加display_columns字段（如果不存在）
    try {
      await client.query(`
        ALTER TABLE config ADD COLUMN IF NOT EXISTS display_columns INTEGER DEFAULT NULL
      `);
    } catch (error) {
      // 忽略字段已存在的错误
      console.log('✅ display_columns字段检查完成');
    }
    
    // 检查并添加table_cloth_color字段（如果不存在）
    try {
      await client.query(`
        ALTER TABLE config ADD COLUMN IF NOT EXISTS table_cloth_color VARCHAR(7) DEFAULT '#8B4513'
      `);
    } catch (error) {
      // 忽略字段已存在的错误
      console.log('✅ table_cloth_color字段检查完成');
    }
    console.log('✅ config表创建/检查完成');

    // 创建传播大使表
    await client.query(`
      CREATE TABLE IF NOT EXISTS ambassadors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ ambassadors表创建/检查完成');

    // 创建persons表（使用ambassador_id代替student_id）
    await client.query(`
      CREATE TABLE IF NOT EXISTS persons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        ambassador_id INTEGER REFERENCES ambassadors(id) ON DELETE SET NULL,
        info TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 检查并添加ambassador_id字段（如果不存在）
    try {
      await client.query(`
        ALTER TABLE persons ADD COLUMN IF NOT EXISTS ambassador_id INTEGER
      `);
      await client.query(`
        ALTER TABLE persons DROP CONSTRAINT IF EXISTS fk_persons_ambassador
      `);
      await client.query(`
        ALTER TABLE persons ADD CONSTRAINT fk_persons_ambassador 
        FOREIGN KEY (ambassador_id) REFERENCES ambassadors(id) ON DELETE SET NULL
      `);
    } catch (error) {
      // 忽略字段已存在的错误
      console.log('✅ ambassador_id字段检查完成');
    }
    console.log('✅ persons表创建/检查完成');

    // 创建seat_assignments表
    await client.query(`
      CREATE TABLE IF NOT EXISTS seat_assignments (
        id SERIAL PRIMARY KEY,
        person_id INTEGER REFERENCES persons(id) ON DELETE CASCADE,
        desk_number INTEGER,
        seat_number INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(desk_number, seat_number)
      )
    `);
    console.log('✅ seat_assignments表创建/检查完成');

    // 插入默认配置（如果不存在）
    const configResult = await client.query('SELECT COUNT(*) FROM config');
    if (parseInt(configResult.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO config (desk_count, seats_per_desk) 
        VALUES (4, 8)
      `);
      console.log('✅ 默认配置插入完成: 4桌，每桌8座位');
    }

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

// 优雅关闭数据库连接
export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log('📴 数据库连接已关闭');
}
