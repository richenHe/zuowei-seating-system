import { Router } from 'express';                    // 导入Express路由器
import { pool } from '../config/database.js';          // 导入数据库连接池
import { Ambassador, AmbassadorCreateRequest, AmbassadorUpdateRequest, ApiResponse } from '../models/types.js';  // 导入类型定义

const router = Router();                               // 创建路由器实例

// GET /api/ambassadors - 获取所有传播大使
router.get('/', async (req, res) => {
  try {
    // 查询所有传播大使，按创建时间排序
    const result = await pool.query(`
      SELECT * FROM ambassadors 
      ORDER BY created_at ASC
    `);
    
    // 构造成功响应
    const response: ApiResponse<Ambassador[]> = {
      success: true,                               // 标记为成功
      data: result.rows                            // 返回查询结果
    };
    
    res.json(response);                            // 发送JSON响应
  } catch (error) {
    console.error('获取传播大使列表失败:', error);   // 记录错误日志
    // 构造错误响应
    const response: ApiResponse = {
      success: false,                              // 标记为失败
      error: '获取传播大使列表失败'                   // 错误信息
    };
    res.status(500).json(response);                // 发送500错误响应
  }
});

// POST /api/ambassadors - 添加传播大使
router.post('/', async (req, res) => {
  try {
    const { name }: AmbassadorCreateRequest = req.body;  // 从请求体获取大使姓名

    // 参数验证：检查姓名是否为空
    if (!name || name.trim().length === 0) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '大使姓名不能为空'                    // 错误信息
      };
      return res.status(400).json(response);      // 发送400错误响应
    }

    // 姓名长度验证
    if (name.length > 100) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '姓名长度不能超过100字符'              // 错误信息
      };
      return res.status(400).json(response);      // 发送400错误响应
    }

    // 检查姓名是否已存在
    const existingResult = await pool.query(
      'SELECT id FROM ambassadors WHERE name = $1',  // 查询相同姓名的大使
      [name.trim()]
    );
    
    if (existingResult.rows.length > 0) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '该大使姓名已存在'                    // 错误信息
      };
      return res.status(400).json(response);      // 发送400错误响应
    }

    // 插入新的传播大使
    const result = await pool.query(`
      INSERT INTO ambassadors (name, created_at)
      VALUES ($1, CURRENT_TIMESTAMP)
      RETURNING *
    `, [name.trim()]);                             // 使用去除空格的姓名

    // 构造成功响应
    const response: ApiResponse<Ambassador> = {
      success: true,                               // 标记为成功
      data: result.rows[0],                        // 返回新创建的大使信息
      message: '添加传播大使成功'                    // 成功消息
    };
    
    res.json(response);                            // 发送JSON响应
  } catch (error) {
    console.error('添加传播大使失败:', error);       // 记录错误日志
    // 构造错误响应
    const response: ApiResponse = {
      success: false,                              // 标记为失败
      error: '添加传播大使失败'                      // 错误信息
    };
    res.status(500).json(response);                // 发送500错误响应
  }
});

// PUT /api/ambassadors/:id - 更新传播大使信息
router.put('/:id', async (req, res) => {
  try {
    const ambassadorId = parseInt(req.params.id); // 从URL参数获取大使ID
    const { name }: AmbassadorUpdateRequest = req.body;  // 从请求体获取更新数据

    // 参数验证：检查ID是否有效
    if (isNaN(ambassadorId)) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '无效的传播大使ID'                    // 错误信息
      };
      return res.status(400).json(response);      // 发送400错误响应
    }

    // 检查传播大使是否存在
    const existingResult = await pool.query(
      'SELECT id FROM ambassadors WHERE id = $1', // 查询大使是否存在
      [ambassadorId]
    );

    if (existingResult.rows.length === 0) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '传播大使不存在'                      // 错误信息
      };
      return res.status(404).json(response);      // 发送404错误响应
    }

    // 构建更新字段
    const updateFields: string[] = [];             // 存储要更新的字段
    const values: any[] = [];                      // 存储对应的值
    let paramIndex = 1;                            // 参数索引

    if (name !== undefined) {                      // 如果提供了姓名
      if (name.trim().length === 0) {
        const response: ApiResponse = {
          success: false,                          // 标记为失败
          error: '姓名不能为空'                      // 错误信息
        };
        return res.status(400).json(response);    // 发送400错误响应
      }

      // 检查姓名是否被其他大使使用
      const duplicateResult = await pool.query(
        'SELECT id FROM ambassadors WHERE name = $1 AND id != $2',  // 查询重复姓名
        [name.trim(), ambassadorId]
      );
      
      if (duplicateResult.rows.length > 0) {
        const response: ApiResponse = {
          success: false,                          // 标记为失败
          error: '该姓名已被其他大使使用'              // 错误信息
        };
        return res.status(400).json(response);    // 发送400错误响应
      }
      
      updateFields.push(`name = $${paramIndex}`);  // 添加名称更新字段
      values.push(name.trim());                    // 添加名称值
      paramIndex++;
    }

    // 检查是否有要更新的字段
    if (updateFields.length === 0) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '没有提供要更新的字段'                // 错误信息
      };
      return res.status(400).json(response);      // 发送400错误响应
    }

    // 执行更新
    values.push(ambassadorId);                     // 添加ID作为最后一个参数
    const result = await pool.query(`
      UPDATE ambassadors 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    // 构造成功响应
    const ambassador: Ambassador = result.rows[0]; // 获取更新后的大使信息
    const response: ApiResponse<Ambassador> = {
      success: true,                               // 标记为成功
      data: ambassador,                            // 返回更新后的数据
      message: '更新传播大使信息成功'                // 成功消息
    };
    
    res.json(response);                            // 发送JSON响应
  } catch (error) {
    console.error('更新传播大使信息失败:', error);   // 记录错误日志
    // 构造错误响应
    const response: ApiResponse = {
      success: false,                              // 标记为失败
      error: '更新传播大使信息失败'                  // 错误信息
    };
    res.status(500).json(response);                // 发送500错误响应
  }
});

// DELETE /api/ambassadors/batch - 批量删除传播大使
router.delete('/batch', async (req, res) => {
  try {
    const { ambassador_ids }: { ambassador_ids: number[] } = req.body;  // 从请求体获取大使ID数组

    // 参数验证：检查ID数组是否有效
    if (!Array.isArray(ambassador_ids) || ambassador_ids.length === 0) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '请提供要删除的传播大使ID列表'           // 错误信息
      };
      return res.status(400).json(response);      // 发送400错误响应
    }

    // 验证所有ID都是有效数字
    const validIds = ambassador_ids.filter(id => Number.isInteger(id) && id > 0);
    if (validIds.length === 0) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '传播大使ID格式无效'                  // 错误信息
      };
      return res.status(400).json(response);      // 发送400错误响应
    }

    // 查询要删除的传播大使信息（用于返回消息）
    const ambassadorsResult = await pool.query(
      'SELECT id, name FROM ambassadors WHERE id = ANY($1)',  // 查询指定ID的大使
      [validIds]
    );

    const foundAmbassadors = ambassadorsResult.rows;
    if (foundAmbassadors.length === 0) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '未找到要删除的传播大使'              // 错误信息
      };
      return res.status(404).json(response);      // 发送404错误响应
    }

    // 批量删除传播大使
    const deleteResult = await pool.query(
      'DELETE FROM ambassadors WHERE id = ANY($1) RETURNING id, name',  // 删除指定ID的大使并返回信息
      [validIds]
    );

    const deletedAmbassadors = deleteResult.rows;
    const deletedNames = deletedAmbassadors.map(a => a.name).join('、');

    // 构造成功响应
    const response: ApiResponse = {
      success: true,                               // 标记为成功
      message: `成功删除${deletedAmbassadors.length}位传播大使：${deletedNames}`  // 成功消息
    };
    
    res.json(response);                            // 发送JSON响应
  } catch (error) {
    console.error('批量删除传播大使失败:', error);   // 记录错误日志
    // 构造错误响应
    const response: ApiResponse = {
      success: false,                              // 标记为失败
      error: '批量删除传播大使失败'                  // 错误信息
    };
    res.status(500).json(response);                // 发送500错误响应
  }
});

// DELETE /api/ambassadors/:id - 删除传播大使
router.delete('/:id', async (req, res) => {
  try {
    const ambassadorId = parseInt(req.params.id); // 从URL参数获取大使ID

    // 参数验证：检查ID是否有效
    if (isNaN(ambassadorId)) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '无效的传播大使ID'                    // 错误信息
      };
      return res.status(400).json(response);      // 发送400错误响应
    }

    // 检查传播大使是否存在
    const existingResult = await pool.query(
      'SELECT id, name FROM ambassadors WHERE id = $1',  // 查询大使信息
      [ambassadorId]
    );

    if (existingResult.rows.length === 0) {
      const response: ApiResponse = {
        success: false,                            // 标记为失败
        error: '传播大使不存在'                      // 错误信息
      };
      return res.status(404).json(response);      // 发送404错误响应
    }

    const ambassadorName = existingResult.rows[0].name;  // 获取大使姓名

    // 删除传播大使（相关的人员会自动设置ambassador_id为NULL）
    await pool.query('DELETE FROM ambassadors WHERE id = $1', [ambassadorId]);

    // 构造成功响应
    const response: ApiResponse = {
      success: true,                               // 标记为成功
      message: `删除传播大使"${ambassadorName}"成功` // 成功消息
    };
    
    res.json(response);                            // 发送JSON响应
  } catch (error) {
    console.error('删除传播大使失败:', error);       // 记录错误日志
    // 构造错误响应
    const response: ApiResponse = {
      success: false,                              // 标记为失败
      error: '删除传播大使失败'                      // 错误信息
    };
    res.status(500).json(response);                // 发送500错误响应
  }
});

export default router;                             // 导出路由器
