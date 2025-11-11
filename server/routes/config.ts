import { Router } from 'express';
import { pool } from '../config/database.js';
import { Config, ConfigUpdateRequest, ApiResponse } from '../models/types.js';

const router = Router();

// GET /api/config - 获取当前配置
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM config ORDER BY updated_at DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      // 如果没有配置，返回默认值
      const response: ApiResponse<Config> = {
        success: true,
        data: {
          id: 0,
          desk_count: 4,
          seats_per_desk: 8,
          display_columns: undefined, // 默认3列
          table_cloth_color: '#8B4513', // 默认桌布颜色（棕色）
          updated_at: new Date().toISOString()
        }
      };
      return res.json(response);
    }

    const config: Config = result.rows[0];
    const response: ApiResponse<Config> = {
      success: true,
      data: config
    };
    
    res.json(response);
  } catch (error) {
    console.error('获取配置失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '获取配置失败'
    };
    res.status(500).json(response);
  }
});

// PUT /api/config - 更新配置（桌数、座位数、列数）
router.put('/', async (req, res) => {
  try {
    const { desk_count, seats_per_desk, display_columns, table_cloth_color }: ConfigUpdateRequest = req.body;

    // 参数验证
    if (!desk_count || !seats_per_desk) {
      const response: ApiResponse = {
        success: false,
        error: '桌子数量和每桌座位数不能为空'
      };
      return res.status(400).json(response);
    }

    if (desk_count < 1 || desk_count > 50) {
      const response: ApiResponse = {
        success: false,
        error: '桌子数量必须在1-50之间'
      };
      return res.status(400).json(response);
    }

    if (seats_per_desk < 4 || seats_per_desk > 12) {
      const response: ApiResponse = {
        success: false,
        error: '每桌座位数必须在4-12之间'
      };
      return res.status(400).json(response);
    }

    // 验证列数（可选）
    if (display_columns !== undefined && display_columns !== null) {
      if (display_columns < 3 || display_columns > 10) {
        const response: ApiResponse = {
          success: false,
          error: '列数必须在3-10之间'
        };
        return res.status(400).json(response);
      }
    }

    // 验证桌布颜色（可选）
    if (table_cloth_color !== undefined && table_cloth_color !== null) {
      // 检查是否为有效的颜色值（支持#RRGGBB格式）
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(table_cloth_color)) {
        const response: ApiResponse = {
          success: false,
          error: '桌布颜色必须为有效的十六进制颜色值（如#8B4513）'
        };
        return res.status(400).json(response);
      }
    }

    // 检查是否已有配置记录
    const existingConfigResult = await pool.query(
      'SELECT id FROM config ORDER BY updated_at DESC LIMIT 1'
    );

    let result;
    if (existingConfigResult.rows.length > 0) {
      // 如果已有配置，更新最新的一条记录
      const existingConfigId = existingConfigResult.rows[0].id;
      result = await pool.query(`
        UPDATE config 
        SET desk_count = $1, seats_per_desk = $2, display_columns = $3, table_cloth_color = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `, [desk_count, seats_per_desk, display_columns, table_cloth_color || '#8B4513', existingConfigId]);
      
      console.log('✅ 更新配置记录 ID:', existingConfigId);
    } else {
      // 如果没有配置，插入第一条记录
      result = await pool.query(`
        INSERT INTO config (desk_count, seats_per_desk, display_columns, table_cloth_color, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING *
      `, [desk_count, seats_per_desk, display_columns, table_cloth_color || '#8B4513']);
      
      console.log('✅ 创建首个配置记录');
    }

    const config: Config = result.rows[0];
    const response: ApiResponse<Config> = {
      success: true,
      data: config,
      message: '配置更新成功'
    };
    
    res.json(response);
  } catch (error) {
    console.error('更新配置失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '更新配置失败'
    };
    res.status(500).json(response);
  }
});

export default router;
