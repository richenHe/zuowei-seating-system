import { Router } from 'express';
import { pool } from '../config/database.js';
import { Person, PersonCreateRequest, PersonUpdateRequest, PersonWithAssignment, ApiResponse } from '../models/types.js';

const router = Router();

// GET /api/persons - 获取所有人员（包含大使信息）
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.ambassador_id, p.position, p.tel, p.background, p.info, p.created_at,
             a.name as ambassador_name, sa.desk_number, sa.seat_number
      FROM persons p
      LEFT JOIN ambassadors a ON p.ambassador_id = a.id
      LEFT JOIN seat_assignments sa ON p.id = sa.person_id
      ORDER BY p.created_at ASC
    `);
    
    const persons = result.rows;
    const response: ApiResponse<PersonWithAssignment[]> = {
      success: true,
      data: persons
    };
    
    res.json(response);
  } catch (error) {
    console.error('获取人员列表失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '获取人员列表失败'
    };
    res.status(500).json(response);
  }
});

// POST /api/persons - 添加人员
router.post('/', async (req, res) => {
  try {
    const { name, ambassador_id, position, tel, background, info }: PersonCreateRequest = req.body;

    // 参数验证
    if (!name || name.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '姓名不能为空'
      };
      return res.status(400).json(response);
    }

    if (name.length > 100) {
      const response: ApiResponse = {
        success: false,
        error: '姓名长度不能超过100字符'
      };
      return res.status(400).json(response);
    }

    // 验证电话长度
    if (tel && tel.trim().length > 30) {
      const response: ApiResponse = {
        success: false,
        error: '电话长度不能超过30字符'
      };
      return res.status(400).json(response);
    }

    // 验证背景长度
    if (background && background.trim().length > 255) {
      const response: ApiResponse = {
        success: false,
        error: '背景长度不能超过255字符'
      };
      return res.status(400).json(response);
    }

    // 检查传播大使是否存在（如果提供了ambassador_id）
    if (ambassador_id) {
      const ambassadorResult = await pool.query(
        'SELECT id FROM ambassadors WHERE id = $1',
        [ambassador_id]
      );
      
      if (ambassadorResult.rows.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: '指定的传播大使不存在'
        };
        return res.status(400).json(response);
      }
    }

    // 插入新人员
    const result = await pool.query(`
      INSERT INTO persons (name, ambassador_id, position, tel, background, info, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      name.trim(), 
      ambassador_id || null, 
      position || null, 
      tel?.trim() || null, 
      background?.trim() || null, 
      info?.trim() || null
    ]);

    const person: Person = result.rows[0];
    const response: ApiResponse<Person> = {
      success: true,
      data: person,
      message: '添加人员成功'
    };
    
    res.json(response);
  } catch (error) {
    console.error('添加人员失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '添加人员失败'
    };
    res.status(500).json(response);
  }
});

// PUT /api/persons/:id - 更新人员信息
router.put('/:id', async (req, res) => {
  try {
    const personId = parseInt(req.params.id);
    const { name, ambassador_id, position, tel, background, info }: PersonUpdateRequest = req.body;

    // 参数验证
    if (isNaN(personId)) {
      const response: ApiResponse = {
        success: false,
        error: '无效的人员ID'
      };
      return res.status(400).json(response);
    }

    // 检查人员是否存在
    const existingResult = await pool.query(
      'SELECT id FROM persons WHERE id = $1',
      [personId]
    );

    if (existingResult.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '人员不存在'
      };
      return res.status(404).json(response);
    }

    // 构建更新字段
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      if (name.trim().length === 0) {
        const response: ApiResponse = {
          success: false,
          error: '姓名不能为空'
        };
        return res.status(400).json(response);
      }
      if (name.length > 100) {
        const response: ApiResponse = {
          success: false,
          error: '姓名长度不能超过100字符'
        };
        return res.status(400).json(response);
      }
      updateFields.push(`name = $${paramIndex}`);
      values.push(name.trim());
      paramIndex++;
    }

    if (ambassador_id !== undefined) {
      // 检查传播大使是否存在（如果提供了ambassador_id）
      if (ambassador_id) {
        const ambassadorResult = await pool.query(
          'SELECT id FROM ambassadors WHERE id = $1',
          [ambassador_id]
        );
        
        if (ambassadorResult.rows.length === 0) {
          const response: ApiResponse = {
            success: false,
            error: '指定的传播大使不存在'
          };
          return res.status(400).json(response);
        }
      }
      
      updateFields.push(`ambassador_id = $${paramIndex}`);
      values.push(ambassador_id || null);
      paramIndex++;
    }

    if (position !== undefined) {
      updateFields.push(`position = $${paramIndex}`);
      values.push(position || null);
      paramIndex++;
    }

    if (tel !== undefined) {
      if (tel && tel.trim().length > 30) {
        const response: ApiResponse = {
          success: false,
          error: '电话长度不能超过30字符'
        };
        return res.status(400).json(response);
      }
      updateFields.push(`tel = $${paramIndex}`);
      values.push(tel?.trim() || null);
      paramIndex++;
    }

    if (background !== undefined) {
      if (background && background.trim().length > 255) {
        const response: ApiResponse = {
          success: false,
          error: '背景长度不能超过255字符'
        };
        return res.status(400).json(response);
      }
      updateFields.push(`background = $${paramIndex}`);
      values.push(background?.trim() || null);
      paramIndex++;
    }

    if (info !== undefined) {
      updateFields.push(`info = $${paramIndex}`);
      values.push(info?.trim() || null);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '没有提供要更新的字段'
      };
      return res.status(400).json(response);
    }

    // 执行更新
    values.push(personId);
    const result = await pool.query(`
      UPDATE persons 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    const person: Person = result.rows[0];
    const response: ApiResponse<Person> = {
      success: true,
      data: person,
      message: '更新人员信息成功'
    };
    
    res.json(response);
  } catch (error) {
    console.error('更新人员信息失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '更新人员信息失败'
    };
    res.status(500).json(response);
  }
});

// DELETE /api/persons/batch - 批量删除人员
router.delete('/batch', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { person_ids }: { person_ids: number[] } = req.body;

    // 调试日志
    console.log('🔍 批量删除请求 - person_ids:', person_ids);
    console.log('🔍 person_ids类型:', typeof person_ids, '是否数组:', Array.isArray(person_ids));

    // 参数验证
    if (!person_ids || !Array.isArray(person_ids) || person_ids.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '人员ID列表不能为空'
      };
      return res.status(400).json(response);
    }

    // 验证所有ID都是有效数字
    const invalidIds = person_ids.filter(id => {
      const isInvalid = isNaN(Number(id)) || Number(id) <= 0;
      console.log(`🔍 检查ID ${id}: isNaN(${Number(id)})=${isNaN(Number(id))}, ${Number(id)} <= 0=${Number(id) <= 0}, 无效=${isInvalid}`);
      return isInvalid;
    });
    
    if (invalidIds.length > 0) {
      console.log('❌ 发现无效ID:', invalidIds);
      const response: ApiResponse = {
        success: false,
        error: `包含无效的人员ID: ${invalidIds.join(', ')}`
      };
      return res.status(400).json(response);
    }

    // 开始事务
    await client.query('BEGIN');

    // 检查哪些人员存在
    const existingResult = await client.query(
      'SELECT id, name FROM persons WHERE id = ANY($1::int[])',
      [person_ids]
    );

    const existingIds = existingResult.rows.map(row => row.id);
    const missingIds = person_ids.filter(id => !existingIds.includes(id));

    if (missingIds.length > 0) {
      await client.query('ROLLBACK');
      const response: ApiResponse = {
        success: false,
        error: `人员ID不存在: ${missingIds.join(', ')}`
      };
      return res.status(404).json(response);
    }

    // 删除相关的座位分配
    await client.query(
      'DELETE FROM seat_assignments WHERE person_id = ANY($1::int[])',
      [person_ids]
    );

    // 删除人员
    const deleteResult = await client.query(
      'DELETE FROM persons WHERE id = ANY($1::int[]) RETURNING id, name',
      [person_ids]
    );

    // 提交事务
    await client.query('COMMIT');

    const deletedPersons = deleteResult.rows;
    const response: ApiResponse = {
      success: true,
      message: `成功删除 ${deletedPersons.length} 人：${deletedPersons.map(p => p.name).join('、')}`
    };
    
    res.json(response);
  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error('批量删除人员失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '批量删除人员失败'
    };
    res.status(500).json(response);
  } finally {
    client.release();
  }
});

// DELETE /api/persons/:id - 删除人员
router.delete('/:id', async (req, res) => {
  try {
    const personId = parseInt(req.params.id);

    // 参数验证
    if (isNaN(personId)) {
      const response: ApiResponse = {
        success: false,
        error: '无效的人员ID'
      };
      return res.status(400).json(response);
    }

    // 检查人员是否存在
    const existingResult = await pool.query(
      'SELECT id, name FROM persons WHERE id = $1',
      [personId]
    );

    if (existingResult.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '人员不存在'
      };
      return res.status(404).json(response);
    }

    const personName = existingResult.rows[0].name;

    // 删除人员（座位分配会自动级联删除）
    await pool.query('DELETE FROM persons WHERE id = $1', [personId]);

    const response: ApiResponse = {
      success: true,
      message: `删除人员"${personName}"成功`
    };
    
    res.json(response);
  } catch (error) {
    console.error('删除人员失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '删除人员失败'
    };
    res.status(500).json(response);
  }
});

export default router;
