// 共享类型定义 - 排座位表系统

// 数据库实体类型
export interface Config {
  id: number;                    // 主键ID
  desk_count: number;            // 桌子数量
  seats_per_desk: number;        // 每桌座位数
  display_columns?: number;      // 列数（可选，默认为3列）
  table_cloth_color?: string;    // 桌布颜色（新增）
  updated_at: string;            // 更新时间
}

export interface Ambassador {
  id: number;                    // 主键ID
  name: string;                  // 大使姓名
  created_at: string;            // 创建时间
}

export interface Person {
  id: number;                    // 主键ID
  name: string;                  // 姓名
  ambassador_id?: number;        // 传播大使ID（外键）
  position?: number;             // 职务：1辅导员 2助攻手 3组长 4副组长 5学员
  tel?: string;                  // 电话
  background?: string;           // 背景
  info?: string;                 // 其他信息
  created_at: string;            // 创建时间
}

export interface SeatAssignment {
  id: number;                    // 主键ID
  person_id: number;             // 人员ID
  desk_number?: number;          // 桌号（NULL表示在备选区）
  seat_number?: number;          // 座位号（NULL表示在备选区）
  updated_at: string;            // 更新时间
}

// API请求和响应类型
export interface ConfigUpdateRequest {
  desk_count: number;            // 桌子数量
  seats_per_desk: number;        // 每桌座位数
  display_columns?: number;      // 列数（可选，默认3列）
  table_cloth_color?: string;    // 桌布颜色（可选）
}

export interface PersonCreateRequest {
  name: string;                  // 姓名
  ambassador_id?: number | null; // 传播大使ID (null表示无传播大使)
  position?: number;             // 职务：1辅导员 2助攻手 3组长 4副组长 5学员
  tel?: string;                  // 电话
  background?: string;           // 背景
  info?: string;                 // 其他信息
}

export interface PersonUpdateRequest {
  name?: string;                 // 姓名
  ambassador_id?: number | null; // 传播大使ID (null表示无传播大使)
  position?: number;             // 职务：1辅导员 2助攻手 3组长 4副组长 5学员
  tel?: string;                  // 电话
  background?: string;           // 背景
  info?: string;                 // 其他信息
}

// 传播大使相关请求类型
export interface AmbassadorCreateRequest {
  name: string;                  // 大使姓名
}

export interface AmbassadorUpdateRequest {
  name?: string;                 // 大使姓名
}

// 批量导入相关类型
export interface PersonImportRow {
  name: string;                  // 姓名
  position?: string;             // 职务（文本形式）
  tel?: string;                  // 电话
  background?: string;           // 背景
  ambassador_name?: string;      // 传播大使姓名
  info?: string;                 // 其他信息
}

export interface PersonImportValidationError {
  row: number;                   // 行号（从1开始，Excel中的实际行号）
  field: string;                 // 字段名
  message: string;               // 错误信息
}

export interface PersonImportResult {
  total: number;                 // 总行数
  success: number;               // 成功导入数量
  skipped: number;               // 跳过数量（重复）
  failed: number;                // 失败数量
  errors: PersonImportValidationError[]; // 错误列表
  message: string;               // 结果消息
}

export interface AssignmentUpdateRequest {
  person_id: number;             // 人员ID
  desk_number?: number;          // 桌号（null表示备选区）
  seat_number?: number;          // 座位号（null表示备选区）
}

export interface BatchAssignmentUpdateRequest {
  assignments: AssignmentUpdateRequest[];  // 批量座位分配
}

// 前端显示用的扩展类型
export interface PersonWithAssignment extends Person {
  ambassador_name?: string;      // 大使姓名
  desk_number?: number;          // 当前桌号
  seat_number?: number;          // 当前座位号
}

export interface SeatInfo {
  desk_number: number;           // 桌号
  seat_number: number;           // 座位号
  person?: PersonWithAssignment; // 座位上的人员信息
}

export interface DeskLayout {
  desk_number: number;           // 桌号
  seats: SeatInfo[];             // 座位列表
}

// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean;              // 是否成功
  data?: T;                      // 响应数据
  message?: string;              // 响应信息
  error?: string;                // 错误信息
}

// 错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
