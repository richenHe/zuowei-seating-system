// 座位布局工具函数 - 排座位表系统
import type { SeatPosition, PersonWithAssignment, AssignmentUpdateRequest } from '@/types'

/**
 * 计算圆桌周围座位的坐标位置
 */
export function calculateSeatPosition(
  deskCenter: { x: number; y: number },
  seatIndex: number,
  totalSeats: number,
  radius: number = 100
): SeatPosition {
  // 从12点钟方向开始，顺时针分布座位
  const angle = (2 * Math.PI * seatIndex) / totalSeats - Math.PI / 2
  
  const x = deskCenter.x + radius * Math.cos(angle)
  const y = deskCenter.y + radius * Math.sin(angle)
  
  return { x, y, angle }
}

/**
 * 获取座位的CSS定位类名
 * 基于8座位的圆桌布局
 */
export function getSeatPositionClass(seatIndex: number, totalSeats: number = 8): string {
  // 确保座位索引在有效范围内
  const normalizedIndex = seatIndex % totalSeats
  
  // 返回对应的CSS类名
  return `seat-${normalizedIndex}`
}

/**
 * 计算桌子在网格中的最佳排列
 */
export function calculateDeskGridLayout(deskCount: number) {
  if (deskCount <= 1) return { cols: 1, rows: 1 }
  if (deskCount <= 2) return { cols: 2, rows: 1 }
  if (deskCount <= 4) return { cols: 2, rows: 2 }
  if (deskCount <= 6) return { cols: 3, rows: 2 }
  if (deskCount <= 9) return { cols: 3, rows: 3 }
  if (deskCount <= 12) return { cols: 4, rows: 3 }
  if (deskCount <= 16) return { cols: 4, rows: 4 }
  
  // 对于更多桌子，计算接近正方形的布局
  const cols = Math.ceil(Math.sqrt(deskCount))
  const rows = Math.ceil(deskCount / cols)
  
  return { cols, rows }
}

/**
 * 生成响应式网格CSS类名
 */
export function getGridCssClass(deskCount: number): string {
  if (deskCount <= 1) return 'grid-cols-1'
  if (deskCount <= 2) return 'grid-cols-1 sm:grid-cols-2'
  if (deskCount <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
  if (deskCount <= 6) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  if (deskCount <= 9) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
}

/**
 * 随机分配算法 - 将人员随机分配到空座位
 */
export function randomAssignSeats(
  waitingPersons: PersonWithAssignment[],
  emptySeats: { desk: number; seat: number }[],
  options: {
    avoidAdjacent?: boolean,    // 是否避免相邻座位
    groupBySimilarity?: boolean, // 是否按相似性分组
    seed?: number               // 随机种子
  } = {}
): AssignmentUpdateRequest[] {
  if (waitingPersons.length === 0 || emptySeats.length === 0) {
    return []
  }

  const assignments: AssignmentUpdateRequest[] = []
  const availableSeats = [...emptySeats]
  const personsToAssign = [...waitingPersons]

  // 设置随机种子（可选）
  if (options.seed) {
    Math.seedrandom = options.seed
  }

  // 随机打乱人员和座位顺序
  shuffleArray(personsToAssign)
  shuffleArray(availableSeats)

  // 分配逻辑
  for (let i = 0; i < Math.min(personsToAssign.length, availableSeats.length); i++) {
    const person = personsToAssign[i]
    let seatIndex = i

    // 如果需要避免相邻，尝试找到非相邻座位
    if (options.avoidAdjacent && i > 0) {
      seatIndex = findNonAdjacentSeat(availableSeats, assignments) ?? i
    }

    const seat = availableSeats[seatIndex]
    
    assignments.push({
      person_id: person.id,
      desk_number: seat.desk,
      seat_number: seat.seat
    })

    // 从可用座位中移除已分配的座位
    availableSeats.splice(seatIndex, 1)
  }

  return assignments
}

/**
 * 查找非相邻的座位
 */
function findNonAdjacentSeat(
  availableSeats: { desk: number; seat: number }[],
  existingAssignments: AssignmentUpdateRequest[]
): number | null {
  for (let i = 0; i < availableSeats.length; i++) {
    const seat = availableSeats[i]
    let hasAdjacent = false

    for (const assignment of existingAssignments) {
      if (assignment.desk_number === seat.desk) {
        // 检查是否为相邻座位（圆桌中相邻座位号相差1或首尾相连）
        const seatDiff = Math.abs((assignment.seat_number ?? 0) - seat.seat)
        if (seatDiff === 1 || seatDiff === 7) { // 8座位圆桌，0和7是相邻的
          hasAdjacent = true
          break
        }
      }
    }

    if (!hasAdjacent) {
      return i
    }
  }

  return null
}

/**
 * 数组随机打乱（Fisher-Yates算法）
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * 智能排座建议算法
 * 根据人员信息（如身高、性格等）给出排座建议
 */
export function generateSeatingRecommendations(
  persons: PersonWithAssignment[],
  config: { desk_count: number; seats_per_desk: number }
): {
  recommendations: AssignmentUpdateRequest[]
  reasons: Array<{ person_id: number; reason: string }>
} {
  const recommendations: AssignmentUpdateRequest[] = []
  const reasons: Array<{ person_id: number; reason: string }> = []

  // 简单的分配策略：按姓名首字母排序
  const sortedPersons = [...persons].sort((a, b) => a.name.localeCompare(b.name))
  
  let currentDesk = 1
  let currentSeat = 0

  for (const person of sortedPersons) {
    recommendations.push({
      person_id: person.id,
      desk_number: currentDesk,
      seat_number: currentSeat
    })

    reasons.push({
      person_id: person.id,
      reason: `按字母顺序排列，分配到桌${currentDesk}座位${currentSeat + 1}`
    })

    // 移动到下一个座位
    currentSeat++
    if (currentSeat >= config.seats_per_desk) {
      currentSeat = 0
      currentDesk++
      if (currentDesk > config.desk_count) {
        break // 座位不足
      }
    }
  }

  return { recommendations, reasons }
}

/**
 * 验证座位分配的有效性
 */
export function validateSeatAssignments(
  assignments: AssignmentUpdateRequest[],
  config: { desk_count: number; seats_per_desk: number }
): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const usedSeats = new Set<string>()

  for (const assignment of assignments) {
    const { person_id, desk_number, seat_number } = assignment

    // 检查必需字段
    if (!person_id) {
      errors.push('人员ID不能为空')
      continue
    }

    // 如果分配了座位，检查座位有效性
    if (desk_number !== undefined && seat_number !== undefined) {
      // 检查桌号范围
      if (desk_number < 1 || desk_number > config.desk_count) {
        errors.push(`桌号 ${desk_number} 超出范围 (1-${config.desk_count})`)
      }

      // 检查座位号范围
      if (seat_number < 0 || seat_number >= config.seats_per_desk) {
        errors.push(`座位号 ${seat_number} 超出范围 (0-${config.seats_per_desk - 1})`)
      }

      // 检查座位重复
      const seatKey = `${desk_number}-${seat_number}`
      if (usedSeats.has(seatKey)) {
        errors.push(`座位 桌${desk_number}座${seat_number} 被重复分配`)
      } else {
        usedSeats.add(seatKey)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 计算座位利用率统计
 */
export function calculateSeatUtilization(
  assignments: AssignmentUpdateRequest[],
  config: { desk_count: number; seats_per_desk: number }
) {
  const totalSeats = config.desk_count * config.seats_per_desk
  const assignedSeats = assignments.filter(a => 
    a.desk_number !== undefined && a.seat_number !== undefined
  ).length
  const utilizationRate = totalSeats > 0 ? (assignedSeats / totalSeats) * 100 : 0

  // 按桌统计
  const deskUtilization = new Map<number, number>()
  for (let desk = 1; desk <= config.desk_count; desk++) {
    const deskAssignments = assignments.filter(a => a.desk_number === desk)
    const rate = (deskAssignments.length / config.seats_per_desk) * 100
    deskUtilization.set(desk, rate)
  }

  return {
    totalSeats,
    assignedSeats,
    emptySeats: totalSeats - assignedSeats,
    utilizationRate: Math.round(utilizationRate * 100) / 100,
    deskUtilization: Object.fromEntries(deskUtilization)
  }
}
