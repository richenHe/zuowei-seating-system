import { Router } from 'express';
import { pool } from '../config/database.js';
import * as docx from 'docx';
import { ApiResponse } from '../models/types.js';

const router = Router();

// POST /api/export/desk-students-word - 导出每桌学员信息到Word文档
router.post('/desk-students-word', async (req, res) => {
  try {
    // 获取座位分配信息，排除辅导员（position = 1）
    const result = await pool.query(`
      SELECT 
        sa.desk_number,
        sa.seat_number,
        p.name,
        p.position,
        p.student_category,
        p.tel,
        p.background,
        p.info,
        a.name as ambassador_name
      FROM seat_assignments sa
      JOIN persons p ON sa.person_id = p.id
      LEFT JOIN ambassadors a ON p.ambassador_id = a.id
      WHERE sa.desk_number IS NOT NULL 
        AND (p.position IS NULL OR p.position != 1)
      ORDER BY sa.desk_number ASC, sa.seat_number ASC
    `);
    
    const assignments = result.rows;
    
    if (assignments.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '没有找到学员座位分配信息'
      };
      return res.status(404).json(response);
    }

    // 按桌号分组
    const deskGroups: { [key: number]: any[] } = {};
    assignments.forEach(assignment => {
      const deskNumber = assignment.desk_number;
      if (!deskGroups[deskNumber]) {
        deskGroups[deskNumber] = [];
      }
      deskGroups[deskNumber].push(assignment);
    });

    // 创建Word文档
    const children: docx.Paragraph[] = [];

    // 文档标题
    children.push(
      new docx.Paragraph({
        text: '学员座位信息表',
        heading: docx.HeadingLevel.TITLE,
        alignment: docx.AlignmentType.CENTER,
        spacing: {
          after: 400,
        },
      })
    );

    // 为每桌生成内容
    const sortedDeskNumbers = Object.keys(deskGroups).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < sortedDeskNumbers.length; i++) {
      const deskNumber = sortedDeskNumbers[i];
      const students = deskGroups[deskNumber];

      // 桌号标题
      children.push(
        new docx.Paragraph({
          text: `第${deskNumber}组学员信息`,
          heading: docx.HeadingLevel.HEADING_1,
          spacing: {
            before: 300,
            after: 200,
          },
        })
      );

      // 学员分类映射
      const studentCategoryNames: { [key: number]: string } = {
        1: '新学员',
        2: '复训未上密训学员',
        3: '密训班学员',
        4: '传播大使'
      };

      // 为每个学员添加信息
      for (let j = 0; j < students.length; j++) {
        const student = students[j];
        const categoryLabel = student.student_category ? studentCategoryNames[student.student_category] || '' : '';
        
        // 学员姓名和学员分类（加大字体，加粗）
        children.push(
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: student.name,
                bold: true,
                size: 32, // 16pt，比之前更大
              }),
              ...(categoryLabel
                ? [
                    new docx.TextRun({
                      text: '    ' + categoryLabel,
                      bold: true,
                      size: 32,
                    }),
                  ]
                : []),
            ],
            spacing: {
              before: 300, // 增加上方间距
              after: 200,
            },
          })
        );

        // 每个字段信息分行显示
        if (student.position) {
          const positionNames: { [key: number]: string } = {
            2: '助攻手',
            3: '组长', 
            4: '副组长',
            5: '学员'
          };
          children.push(
            new docx.Paragraph({
              text: `职务：${positionNames[student.position] || '未知'}`,
              spacing: { after: 100 },
            })
          );
        }
        
        if (student.tel) {
          children.push(
            new docx.Paragraph({
              text: `电话：${student.tel}`,
              spacing: { after: 100 },
            })
          );
        }
        
        if (student.ambassador_name) {
          children.push(
            new docx.Paragraph({
              text: `传播大使：${student.ambassador_name}`,
              spacing: { after: 100 },
            })
          );
        }
        
        if (student.background) {
          children.push(
            new docx.Paragraph({
              text: `背景：${student.background}`,
              spacing: { after: 100 },
            })
          );
        }
        
        if (student.info) {
          children.push(
            new docx.Paragraph({
              text: `其他信息：${student.info}`,
              spacing: { after: 100 },
            })
          );
        }

        // 如果不是最后一个学员，添加空行和虚线分割
        if (j < students.length - 1) {
          // 空行
          children.push(
            new docx.Paragraph({
              text: '',
              spacing: { after: 200 },
            })
          );
          
          // 分割线
          children.push(
            new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: '_______________________________________________________________________________',
                  color: '666666',
                }),
              ],
              alignment: docx.AlignmentType.CENTER,
              spacing: {
                before: 100,
                after: 200,
              },
            })
          );
        }
      }

      // 如果不是最后一桌，添加分页符
      if (i < sortedDeskNumbers.length - 1) {
        children.push(
          new docx.Paragraph({
            text: '',
            pageBreakBefore: true,
          })
        );
      }
    }

    // 创建文档
    const doc = new docx.Document({
      creator: '座位管理系统',
      title: '学员座位信息表',
      description: '按桌分组的学员详细信息',
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1英寸 = 1440 twentieths of a point
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: children,
        },
      ],
    });

    // 生成文档buffer
    const buffer = await docx.Packer.toBuffer(doc);
    
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '_');
    const filename = `学员座位信息_${timestamp}.docx`;

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', buffer.length.toString());

    // 发送文件
    res.send(buffer);

  } catch (error) {
    console.error('导出Word文档失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '导出Word文档失败'
    };
    res.status(500).json(response);
  }
});

// POST /api/export/sign-in-sheet - 导出各组签到表到Word文档
router.post('/sign-in-sheet', async (req, res) => {
  try {
    // 获取座位分配信息，排除辅导员（position = 1）
    const result = await pool.query(`
      SELECT 
        sa.desk_number,
        p.name,
        p.position
      FROM seat_assignments sa
      JOIN persons p ON sa.person_id = p.id
      WHERE sa.desk_number IS NOT NULL 
        AND (p.position IS NULL OR p.position != 1)
      ORDER BY sa.desk_number ASC, p.name ASC
    `);
    
    const assignments = result.rows;
    
    if (assignments.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '没有找到学员座位分配信息'
      };
      return res.status(404).json(response);
    }

    // 按桌号分组
    const deskGroups: { [key: number]: any[] } = {};
    assignments.forEach(assignment => {
      const deskNumber = assignment.desk_number;
      if (!deskGroups[deskNumber]) {
        deskGroups[deskNumber] = [];
      }
      deskGroups[deskNumber].push(assignment);
    });

    // 创建Word文档内容数组
    const children: (docx.Paragraph | docx.Table)[] = [];

    // 为每桌生成签到表
    const sortedDeskNumbers = Object.keys(deskGroups).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < sortedDeskNumbers.length; i++) {
      const deskNumber = sortedDeskNumbers[i];
      const students = deskGroups[deskNumber];

      // 桌号标题
      children.push(
        new docx.Paragraph({
          children: [
            new docx.TextRun({
              text: `第${deskNumber}组签到表`,
              bold: true,
              size: 32, // 16pt，加大字体
            }),
          ],
          alignment: docx.AlignmentType.CENTER, // 居中
          spacing: {
            before: i === 0 ? 0 : 800,
            after: 400,
          },
        })
      );

      // 创建签到表格
      const tableRows: docx.TableRow[] = [];
      
      // 表头
      tableRows.push(
        new docx.TableRow({
          children: [
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({
                      text: '人员',
                      bold: true,
                      size: 32, // 16pt，加大字体
                    }),
                  ],
                  alignment: docx.AlignmentType.CENTER,
                }),
              ],
              shading: {
                fill: 'CCCCCC',
              },
              width: {
                size: 50,
                type: docx.WidthType.PERCENTAGE,
              },
              verticalAlign: docx.VerticalAlign.CENTER, // 垂直居中
            }),
            new docx.TableCell({
              children: [
                new docx.Paragraph({
                  children: [
                    new docx.TextRun({
                      text: '签名',
                      bold: true,
                      size: 32, // 16pt，加大字体
                    }),
                  ],
                  alignment: docx.AlignmentType.CENTER,
                }),
              ],
              shading: {
                fill: 'CCCCCC',
              },
              width: {
                size: 50,
                type: docx.WidthType.PERCENTAGE,
              },
              verticalAlign: docx.VerticalAlign.CENTER, // 垂直居中
            }),
          ],
        })
      );

      // 学员行
      students.forEach(student => {
        tableRows.push(
          new docx.TableRow({
            children: [
              new docx.TableCell({
                children: [
                  new docx.Paragraph({
                    children: [
                      new docx.TextRun({
                        text: student.name,
                        size: 28, // 14pt，加大姓名字体
                      }),
                    ],
                    alignment: docx.AlignmentType.CENTER,
                  }),
                ],
                width: {
                  size: 50,
                  type: docx.WidthType.PERCENTAGE,
                },
                verticalAlign: docx.VerticalAlign.CENTER, // 垂直居中
              }),
              new docx.TableCell({
                children: [
                  new docx.Paragraph({
                    children: [
                      new docx.TextRun({
                        text: '',
                        size: 22,
                      }),
                    ],
                  }),
                ],
                width: {
                  size: 50,
                  type: docx.WidthType.PERCENTAGE,
                },
                verticalAlign: docx.VerticalAlign.CENTER, // 垂直居中
              }),
            ],
            height: {
              value: 800,
              rule: docx.HeightRule.ATLEAST,
            },
          })
        );
      });

      // 添加表格
      const table = new docx.Table({
        rows: tableRows,
        width: {
          size: 100,
          type: docx.WidthType.PERCENTAGE,
        },
        borders: {
          top: { style: docx.BorderStyle.SINGLE, size: 1 },
          bottom: { style: docx.BorderStyle.SINGLE, size: 1 },
          left: { style: docx.BorderStyle.SINGLE, size: 1 },
          right: { style: docx.BorderStyle.SINGLE, size: 1 },
          insideHorizontal: { style: docx.BorderStyle.SINGLE, size: 1 },
          insideVertical: { style: docx.BorderStyle.SINGLE, size: 1 },
        },
      });
      
      // 添加表格到内容数组
      children.push(table);
      
      // 每组之间添加分页符（除了最后一组）
      if (i < sortedDeskNumbers.length - 1) {
        children.push(
          new docx.Paragraph({
            text: '',
            pageBreakBefore: true,
          })
        );
      }
    }

    // 创建文档，使用已经构建好的children数组
    const doc = new docx.Document({
      creator: '座位管理系统',
      title: '学员签到表',
      description: '按组分类的学员签到表',
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: [
            // 总标题
            new docx.Paragraph({
              children: [
                new docx.TextRun({
                  text: '学员签到表',
                  bold: true,
                  size: 36, // 18pt，主标题字体更大
                }),
              ],
              alignment: docx.AlignmentType.CENTER,
              spacing: {
                after: 600,
              },
            }),
            // 添加所有内容（各组标题和表格）
            ...children,
          ],
        },
      ],
    });

    // 生成文档buffer
    const buffer = await docx.Packer.toBuffer(doc);
    
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '').replace('T', '_');
    const filename = `学员签到表_${timestamp}.docx`;

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', buffer.length.toString());

    // 发送文件
    res.send(buffer);

  } catch (error) {
    console.error('导出签到表失败:', error);
    const response: ApiResponse = {
      success: false,
      error: '导出签到表失败'
    };
    res.status(500).json(response);
  }
});

export default router;
