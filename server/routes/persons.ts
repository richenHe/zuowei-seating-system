import { Router } from 'express';
import { pool } from '../config/database.js';
import { Person, PersonCreateRequest, PersonUpdateRequest, PersonWithAssignment, ApiResponse, PersonImportRow, PersonImportResult, PersonImportValidationError } from '../models/types.js';

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

// GET /api/persons/search - 模糊查询人员（返回姓名和桌号）
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    // 参数验证
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '查询关键词不能为空'
      };
      return res.status(400).json(response);
    }

    const keyword = query.trim();

    // 模糊查询人员（按姓名匹配）
    const result = await pool.query(`
      SELECT p.id, p.name, sa.desk_number, sa.seat_number
      FROM persons p
      LEFT JOIN seat_assignments sa ON p.id = sa.person_id
      WHERE p.name ILIKE $1
      ORDER BY sa.desk_number ASC NULLS LAST, p.name ASC
      LIMIT 50
    `, [`%${keyword}%`]);

    const searchResults = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      desk_number: row.desk_number,
      seat_number: row.seat_number
    }));

    const response: ApiResponse = {
      success: true,
      data: searchResults
    };
    
    res.json(response);
  } catch (error) {
    console.error('模糊查询人员失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '模糊查询人员失败'
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

// POST /api/persons/batch-import - 批量导入人员
router.post('/batch-import', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { data }: { data: PersonImportRow[] } = req.body;

    // 参数验证
    if (!data || !Array.isArray(data) || data.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '导入数据不能为空'
      };
      return res.status(400).json(response);
    }

    // 限制单次导入数量
    if (data.length > 1000) {
      const response: ApiResponse = {
        success: false,
        error: '单次导入数量不能超过1000条'
      };
      return res.status(400).json(response);
    }

    // 职务映射表
    const positionMap: Record<string, number> = {
      '辅导员': 1,
      '助攻手': 2,
      '组长': 3,
      '副组长': 4,
      '学员': 5
    };

    // 验证阶段
    const errors: PersonImportValidationError[] = [];
    const validRows: Array<{ row: number; data: PersonImportRow }> = [];

    // 获取现有人员姓名（用于去重）
    const existingPersonsResult = await client.query('SELECT name FROM persons');
    const existingNames = new Set(existingPersonsResult.rows.map((row: any) => row.name.toLowerCase()));

    // 逐行验证
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel中的实际行号（假设第1行是表头）
      let hasError = false;

      // 验证姓名
      if (!row.name || row.name.trim().length === 0) {
        errors.push({
          row: rowNumber,
          field: '姓名',
          message: `第${rowNumber}行：姓名为空，需要添加`
        });
        hasError = true;
      } else if (row.name.trim().length > 100) {
        errors.push({
          row: rowNumber,
          field: '姓名',
          message: `第${rowNumber}行：姓名长度不能超过100个字符`
        });
        hasError = true;
      }

      // 验证职务
      if (!row.position || row.position.trim().length === 0) {
        errors.push({
          row: rowNumber,
          field: '职务',
          message: `第${rowNumber}行（${row.name}）：职务为空，需要添加`
        });
        hasError = true;
      } else if (!positionMap[row.position.trim()]) {
        errors.push({
          row: rowNumber,
          field: '职务',
          message: `第${rowNumber}行（${row.name}）：职务"${row.position}"无效，必须是：辅导员、助攻手、组长、副组长、学员`
        });
        hasError = true;
      }

      // 验证传播大使
      if (!row.ambassador_name || row.ambassador_name.trim().length === 0) {
        errors.push({
          row: rowNumber,
          field: '传播大使',
          message: `第${rowNumber}行（${row.name}）：传播大使为空，需要添加`
        });
        hasError = true;
      } else if (row.ambassador_name.trim().length > 100) {
        errors.push({
          row: rowNumber,
          field: '传播大使',
          message: `第${rowNumber}行（${row.name}）：传播大使姓名长度不能超过100个字符`
        });
        hasError = true;
      }

      // 验证电话
      if (row.tel && row.tel.trim().length > 30) {
        errors.push({
          row: rowNumber,
          field: '电话',
          message: `第${rowNumber}行（${row.name}）：电话长度不能超过30个字符`
        });
        hasError = true;
      }

      // 验证背景
      if (row.background && row.background.trim().length > 255) {
        errors.push({
          row: rowNumber,
          field: '背景',
          message: `第${rowNumber}行（${row.name}）：背景长度不能超过255个字符`
        });
        hasError = true;
      }

      // 验证其他信息
      if (row.info && row.info.length > 500) {
        errors.push({
          row: rowNumber,
          field: '其他信息',
          message: `第${rowNumber}行（${row.name}）：其他信息长度不能超过500个字符`
        });
        hasError = true;
      }

      // 如果没有错误，添加到有效行列表
      if (!hasError) {
        validRows.push({ row: rowNumber, data: row });
      }
    }

    // 如果有验证错误，返回错误信息
    if (errors.length > 0) {
      const result: PersonImportResult = {
        total: data.length,
        success: 0,
        skipped: 0,
        failed: errors.length,
        errors: errors,
        message: `验证失败：发现 ${errors.length} 个错误，请修正后重新导入`
      };
      const response: ApiResponse<PersonImportResult> = {
        success: false,
        data: result,
        error: `验证失败：发现 ${errors.length} 个错误`
      };
      return res.status(400).json(response);
    }

    // 开始导入
    await client.query('BEGIN');

    let successCount = 0;
    let skippedCount = 0;
    const importErrors: PersonImportValidationError[] = [];

    for (const { row: rowNumber, data: rowData } of validRows) {
      try {
        const trimmedName = rowData.name.trim();
        
        // 检查姓名是否重复（跳过）
        if (existingNames.has(trimmedName.toLowerCase())) {
          skippedCount++;
          continue;
        }

        const ambassadorName = rowData.ambassador_name!.trim();
        const positionValue = positionMap[rowData.position!.trim()];

        // 查询或创建传播大使
        let ambassadorId: number;
        const ambassadorResult = await client.query(
          'SELECT id FROM ambassadors WHERE LOWER(name) = LOWER($1)',
          [ambassadorName]
        );

        if (ambassadorResult.rows.length > 0) {
          // 传播大使已存在
          ambassadorId = ambassadorResult.rows[0].id;
        } else {
          // 创建新的传播大使
          const newAmbassadorResult = await client.query(
            'INSERT INTO ambassadors (name, created_at) VALUES ($1, CURRENT_TIMESTAMP) RETURNING id',
            [ambassadorName]
          );
          ambassadorId = newAmbassadorResult.rows[0].id;
        }

        // 插入人员
        await client.query(
          `INSERT INTO persons (name, ambassador_id, position, tel, background, info, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [
            trimmedName,
            ambassadorId,
            positionValue,
            rowData.tel?.trim() || null,
            rowData.background?.trim() || null,
            rowData.info?.trim() || null
          ]
        );

        // 添加到已存在名单中，防止同一批次中的重复
        existingNames.add(trimmedName.toLowerCase());
        successCount++;

      } catch (error) {
        console.error(`导入第${rowNumber}行失败:`, error);
        importErrors.push({
          row: rowNumber,
          field: '导入',
          message: `第${rowNumber}行（${rowData.name}）：导入失败 - ${error instanceof Error ? error.message : '未知错误'}`
        });
      }
    }

    // 提交事务
    await client.query('COMMIT');

    // 构建结果
    const result: PersonImportResult = {
      total: data.length,
      success: successCount,
      skipped: skippedCount,
      failed: importErrors.length,
      errors: importErrors,
      message: `导入完成：成功 ${successCount} 条，跳过重复 ${skippedCount} 条${importErrors.length > 0 ? `，失败 ${importErrors.length} 条` : ''}`
    };

    const response: ApiResponse<PersonImportResult> = {
      success: true,
      data: result,
      message: result.message
    };

    res.json(response);

  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error('批量导入失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '批量导入失败'
    };
    res.status(500).json(response);
  } finally {
    client.release();
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
