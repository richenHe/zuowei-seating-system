// 前端类型定义 - 排座位表系统
// 与后端server/models/types.ts保持同步

// 基础数据类型
export interface Config {
  id: number;                    // 主键ID
  desk_count: number;            // 桌子数量
  seats_per_desk: number;        // 每桌座位数
  display_columns?: number;      // 显示列数（可选）
  table_cloth_color?: string;    // 桌布颜色（可选）
  updated_at: string;            // 更新时间
}

export interface Person {
  id: number;                    // 主键ID
  name: string;                  // 姓名
  ambassador_id?: number;        // 传播大使ID（可选）
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

// API请求类型
export interface ConfigUpdateRequest {
  desk_count: number;            // 桌子数量
  seats_per_desk: number;        // 每桌座位数
  display_columns?: number;      // 显示列数（可选）
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

export interface AssignmentUpdateRequest {
  person_id: number;             // 人员ID
  desk_number?: number | null;   // 桌号（null表示备选区）
  seat_number?: number | null;   // 座位号（null表示备选区）
}

export interface BatchAssignmentUpdateRequest {
  assignments: AssignmentUpdateRequest[];  // 批量座位分配
}

// 前端显示用的扩展类型
export interface PersonWithAssignment extends Person {
  ambassador_name?: string;      // 大使姓名
  desk_number?: number | null;   // 当前桌号
  seat_number?: number | null;   // 当前座位号
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

// 拖拽相关类型
export interface DragItem {
  type: 'seat' | 'person';       // 拖拽项类型
  person?: PersonWithAssignment;  // 人员信息
  sourceDesk?: number;           // 来源桌号
  sourceSeat?: number;           // 来源座位号
  isFromWaiting?: boolean;       // 是否来自备选区
}

// 座位位置计算类型
export interface SeatPosition {
  x: number;                     // X坐标
  y: number;                     // Y坐标
  angle: number;                 // 角度（弧度）
}

// 表单验证类型
export interface ValidationError {
  field: string;                 // 字段名
  message: string;               // 错误信息
}

// 组件状态类型
export interface AppState {
  config: Config | null;         // 当前配置
  persons: PersonWithAssignment[]; // 人员列表
  layout: DeskLayout[];          // 座位布局
  waiting: PersonWithAssignment[]; // 备选区人员
  loading: boolean;              // 加载状态
  error: string | null;          // 错误信息
}

// Toast提示类型
export interface ToastMessage {
  id: string;                    // 唯一标识
  type: 'success' | 'error' | 'info' | 'warning'; // 提示类型
  title: string;                 // 标题
  message: string;               // 内容
  duration?: number;             // 持续时间（毫秒）
}

// 传播大使相关类型
export interface Ambassador {
  id: number;                    // 主键ID
  name: string;                  // 大使姓名
  created_at: string;            // 创建时间
}

export interface AmbassadorCreateRequest {
  name: string;                  // 大使姓名
}

export interface AmbassadorUpdateRequest {
  name?: string;                 // 大使姓名
}
