import { Router } from 'express';
import { pool } from '../config/database.js';
import { SeatAssignment, AssignmentUpdateRequest, BatchAssignmentUpdateRequest, ApiResponse, PersonWithAssignment, SeatInfo, DeskLayout } from '../models/types.js';

const router = Router();

// GET /api/assignments - 获取所有座位分配
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sa.id,
        sa.person_id,
        sa.desk_number,
        sa.seat_number,
        sa.updated_at,
        p.name,
        p.ambassador_id,
        p.position,
        p.student_category,
        p.tel,
        p.background,
        p.info,
        a.name as ambassador_name
      FROM seat_assignments sa
      JOIN persons p ON sa.person_id = p.id
      LEFT JOIN ambassadors a ON p.ambassador_id = a.id
      ORDER BY sa.desk_number ASC, sa.seat_number ASC
    `);
    
    const assignments = result.rows;
    const response: ApiResponse<SeatAssignment[]> = {
      success: true,
      data: assignments
    };
    
    res.json(response);
  } catch (error) {
    console.error('获取座位分配失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '获取座位分配失败'
    };
    res.status(500).json(response);
  }
});

// GET /api/assignments/layout - 获取座位布局（按桌分组）
router.get('/layout', async (req, res) => {
  try {
    // 获取当前配置
    const configResult = await pool.query(
      'SELECT desk_count, seats_per_desk FROM config ORDER BY updated_at DESC LIMIT 1'
    );
    
    if (configResult.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '未找到配置信息'
      };
      return res.status(404).json(response);
    }

    const { desk_count, seats_per_desk } = configResult.rows[0];

    // 获取所有座位分配
    const assignmentResult = await pool.query(`
      SELECT 
        sa.desk_number,
        sa.seat_number,
        sa.person_id,
        p.name,
        p.ambassador_id,
        p.position,
        p.student_category,
        p.tel,
        p.background,
        p.info,
        p.created_at,
        a.name as ambassador_name
      FROM seat_assignments sa
      JOIN persons p ON sa.person_id = p.id
      LEFT JOIN ambassadors a ON p.ambassador_id = a.id
      WHERE sa.desk_number IS NOT NULL AND sa.seat_number IS NOT NULL
      ORDER BY sa.desk_number ASC, sa.seat_number ASC
    `);

    // 构建桌子布局
    const layout: DeskLayout[] = [];
    
    for (let deskNum = 1; deskNum <= desk_count; deskNum++) { // 从1开始桌号
      const desk: DeskLayout = {
        desk_number: deskNum,
        seats: []
      };

      for (let seatNum = 1; seatNum <= seats_per_desk; seatNum++) { // 从1开始座位号
        const seatInfo: SeatInfo = {
          desk_number: deskNum,
          seat_number: seatNum,
        };

        // 查找该座位上的人员
        const assignment = assignmentResult.rows.find(
          row => row.desk_number === deskNum && row.seat_number === seatNum
        );

        if (assignment) {
          seatInfo.person = {
            id: assignment.person_id,
            name: assignment.name,
            ambassador_id: assignment.ambassador_id,
            position: assignment.position,
            student_category: assignment.student_category,
            tel: assignment.tel,
            background: assignment.background,
            info: assignment.info,
            created_at: assignment.created_at || '',
            ambassador_name: assignment.ambassador_name,
            desk_number: deskNum,
            seat_number: seatNum
          };
        }

        desk.seats.push(seatInfo);
      }

      layout.push(desk);
    }

    // 获取备选区人员（没有有效座位分配的人员）
    const waitingResult = await pool.query(`
      SELECT p.id, p.name, p.ambassador_id, p.position, p.student_category, p.tel, p.background, p.info, p.created_at,
             a.name as ambassador_name
      FROM persons p
      LEFT JOIN seat_assignments sa ON p.id = sa.person_id
      LEFT JOIN ambassadors a ON p.ambassador_id = a.id
      WHERE sa.person_id IS NULL 
         OR sa.desk_number IS NULL 
         OR sa.seat_number IS NULL
         OR sa.desk_number > $1
      ORDER BY p.created_at ASC
    `, [desk_count]);

    // 为备选区人员添加空的座位信息
    const waitingPersons = waitingResult.rows.map(person => ({
      ...person,
      desk_number: null,
      seat_number: null
    }));

    const response: ApiResponse<{layout: DeskLayout[], waiting: PersonWithAssignment[]}> = {
      success: true,
      data: {
        layout,
        waiting: waitingPersons
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('获取座位布局失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '获取座位布局失败'
    };
    res.status(500).json(response);
  }
});

// PUT /api/assignments - 批量更新座位分配（拖拽后保存）
router.put('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { assignments }: BatchAssignmentUpdateRequest = req.body;

    // 参数验证
    if (!assignments || !Array.isArray(assignments)) {
      const response: ApiResponse = {
        success: false,
        error: '座位分配数据格式错误'
      };
      return res.status(400).json(response);
    }

    // 开始事务
    await client.query('BEGIN');

    // 验证所有人员是否存在
    for (const assignment of assignments) {
      const { person_id } = assignment;
      
      const personResult = await client.query(
        'SELECT id FROM persons WHERE id = $1',
        [person_id]
      );

      if (personResult.rows.length === 0) {
        await client.query('ROLLBACK');
        const response: ApiResponse = {
          success: false,
          error: `人员ID ${person_id} 不存在`
        };
        return res.status(400).json(response);
      }
    }

    // 提取所有要更新的人员ID
    const personIds = assignments.map(a => a.person_id);
    
    // 删除这些人员的现有分配（为座位交换做准备）
    if (personIds.length > 0) {
      await client.query(
        `DELETE FROM seat_assignments WHERE person_id = ANY($1::int[])`,
        [personIds]
      );
    }

    // 插入新的座位分配
    for (const assignment of assignments) {
      const { person_id, desk_number, seat_number } = assignment;

      await client.query(`
        INSERT INTO seat_assignments (person_id, desk_number, seat_number, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [person_id, desk_number ?? null, seat_number ?? null]);
    }

    // 提交事务
    await client.query('COMMIT');

    const response: ApiResponse = {
      success: true,
      message: '座位分配更新成功'
    };
    
    res.json(response);
  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error('批量更新座位分配失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '批量更新座位分配失败'
    };
    res.status(500).json(response);
  } finally {
    client.release();
  }
});

// POST /api/assignments/single - 单个座位分配更新
router.post('/single', async (req, res) => {
  try {
    const { person_id, desk_number, seat_number }: AssignmentUpdateRequest = req.body;

    // 参数验证
    if (!person_id) {
      const response: ApiResponse = {
        success: false,
        error: '人员ID不能为空'
      };
      return res.status(400).json(response);
    }

    // 验证人员是否存在
    const personResult = await pool.query(
      'SELECT id, name FROM persons WHERE id = $1',
      [person_id]
    );

    if (personResult.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '人员不存在'
      };
      return res.status(404).json(response);
    }

    // 如果指定了桌号和座位号，检查座位是否已被占用
    if (desk_number !== null && seat_number !== null) {
      const existingResult = await pool.query(
        'SELECT person_id FROM seat_assignments WHERE desk_number = $1 AND seat_number = $2',
        [desk_number, seat_number]
      );

      if (existingResult.rows.length > 0 && existingResult.rows[0].person_id !== person_id) {
        const response: ApiResponse = {
          success: false,
          error: '该座位已被占用'
        };
        return res.status(400).json(response);
      }
    }

    // 删除该人员的现有分配
    await pool.query('DELETE FROM seat_assignments WHERE person_id = $1', [person_id]);

    // 插入新的座位分配
    const result = await pool.query(`
      INSERT INTO seat_assignments (person_id, desk_number, seat_number, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `, [person_id, desk_number ?? null, seat_number ?? null]);

    const assignment: SeatAssignment = result.rows[0];
    const personName = personResult.rows[0].name;
    
    const message = desk_number !== null && seat_number !== null
      ? `${personName} 已分配到桌${desk_number}座位${seat_number}`
      : `${personName} 已移至备选区`;

    const response: ApiResponse<SeatAssignment> = {
      success: true,
      data: assignment,
      message
    };
    
    res.json(response);
  } catch (error) {
    console.error('更新座位分配失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '更新座位分配失败'
    };
    res.status(500).json(response);
  }
});

// DELETE /api/assignments/:personId - 删除指定人员的座位分配（移至备选区）
router.delete('/:personId', async (req, res) => {
  try {
    const personId = parseInt(req.params.personId);

    // 参数验证
    if (isNaN(personId)) {
      const response: ApiResponse = {
        success: false,
        error: '无效的人员ID'
      };
      return res.status(400).json(response);
    }

    // 检查人员是否存在
    const personResult = await pool.query(
      'SELECT id, name FROM persons WHERE id = $1',
      [personId]
    );

    if (personResult.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '人员不存在'
      };
      return res.status(404).json(response);
    }

    // 删除座位分配
    const result = await pool.query(
      'DELETE FROM seat_assignments WHERE person_id = $1 RETURNING *',
      [personId]
    );

    const personName = personResult.rows[0].name;
    
    const response: ApiResponse = result.rows.length === 0 
      ? {
          success: true,
          message: `${personName} 本来就在备选区`
        }
      : {
          success: true,
          message: `${personName} 已移至备选区`
        };
    
    res.json(response);
  } catch (error) {
    console.error('移除座位分配失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '移除座位分配失败'
    };
    res.status(500).json(response);
  }
});

export default router;
