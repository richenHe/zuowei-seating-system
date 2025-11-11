// 拖拽功能组合函数 - 排座位表系统
import { ref, reactive } from 'vue'
import type { PersonWithAssignment, SeatInfo, DragItem } from '@/types'

/**
 * 拖拽状态管理组合函数
 */
export function useDragAndDrop() {
  // ============ 响应式状态 ============
  const isDragging = ref(false)                    // 是否正在拖拽
  const draggedItem = ref<DragItem | null>(null)   // 当前拖拽的项目
  const dropTarget = ref<string | null>(null)      // 拖拽目标区域

  // 拖拽状态统计
  const dragStats = reactive({
    startTime: 0,                // 拖拽开始时间
    totalMoves: 0,               // 总拖拽次数
    lastMoveTime: 0              // 最后移动时间
  })

  // ============ 拖拽数据处理 ============

  /**
   * 创建拖拽数据
   */
  const createDragData = (item: DragItem): string => {
    try {
      return JSON.stringify({
        ...item,
        timestamp: Date.now(),
        dragId: `drag_${Math.random().toString(36).substr(2, 9)}`
      })
    } catch (error) {
      console.error('❌ 创建拖拽数据失败:', error)
      return '{}'
    }
  }

  /**
   * 解析拖拽数据
   */
  const parseDragData = (dataTransfer: DataTransfer): DragItem | null => {
    try {
      const data = dataTransfer.getData('application/json')
      if (!data) return null
      
      const parsed = JSON.parse(data)
      
      // 验证数据完整性
      if (!parsed.type || !['seat', 'person'].includes(parsed.type)) {
        console.warn('⚠️ 无效的拖拽数据类型:', parsed.type)
        return null
      }
      
      return parsed
    } catch (error) {
      console.error('❌ 解析拖拽数据失败:', error)
      return null
    }
  }

  // ============ 拖拽事件处理 ============

  /**
   * 开始拖拽座位
   */
  const startSeatDrag = (
    event: DragEvent, 
    seat: SeatInfo, 
    person: PersonWithAssignment
  ) => {
    if (!event.dataTransfer || !person) return false

    const dragItem: DragItem = {
      type: 'seat',
      person: person,
      sourceDesk: seat.desk_number,
      sourceSeat: seat.seat_number,
      isFromWaiting: false
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', createDragData(dragItem))
    
    // 设置拖拽图像（可选）
    if (event.target instanceof HTMLElement) {
      event.dataTransfer.setDragImage(event.target, 30, 30)
    }

    isDragging.value = true
    draggedItem.value = dragItem
    dragStats.startTime = Date.now()
    dragStats.totalMoves++

    console.log('🚀 开始拖拽座位:', person.name, `桌${seat.desk_number}座${seat.seat_number}`)
    return true
  }

  /**
   * 开始拖拽备选区人员
   */
  const startPersonDrag = (
    event: DragEvent,
    person: PersonWithAssignment
  ) => {
    if (!event.dataTransfer) return false

    const dragItem: DragItem = {
      type: 'person',
      person: person,
      isFromWaiting: true
    }

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', createDragData(dragItem))

    isDragging.value = true
    draggedItem.value = dragItem
    dragStats.startTime = Date.now()
    dragStats.totalMoves++

    console.log('🚀 开始拖拽备选人员:', person.name)
    return true
  }

  /**
   * 处理拖拽结束
   */
  const endDrag = () => {
    isDragging.value = false
    dropTarget.value = null
    dragStats.lastMoveTime = Date.now()
    
    if (draggedItem.value) {
      console.log('✅ 拖拽结束:', draggedItem.value.person?.name)
      draggedItem.value = null
    }
  }

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (event: DragEvent, targetId: string) => {
    event.preventDefault()
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    
    dropTarget.value = targetId
  }

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = (targetId: string) => {
    if (dropTarget.value === targetId) {
      dropTarget.value = null
    }
  }

  // ============ 座位交换逻辑 ============

  /**
   * 检查座位是否可以放置
   */
  const canDropOnSeat = (
    dragData: DragItem, 
    targetSeat: SeatInfo
  ): { canDrop: boolean; reason?: string } => {
    // 不能拖拽到自己原来的位置
    if (dragData.type === 'seat' && 
        dragData.sourceDesk === targetSeat.desk_number && 
        dragData.sourceSeat === targetSeat.seat_number) {
      return { canDrop: false, reason: '不能拖拽到原位置' }
    }

    return { canDrop: true }
  }

  /**
   * 生成座位交换操作
   */
  const createSeatSwapOperation = (
    dragData: DragItem,
    targetSeat: SeatInfo
  ) => {
    if (!dragData.person) return null

    const operations = []

    if (dragData.type === 'seat') {
      // 座位之间的交换
      operations.push({
        type: 'move' as const,
        person: dragData.person,
        fromDesk: dragData.sourceDesk,
        fromSeat: dragData.sourceSeat,
        toDesk: targetSeat.desk_number,
        toSeat: targetSeat.seat_number
      })

      // 如果目标座位有人，需要交换
      if (targetSeat.person) {
        operations.push({
          type: 'move' as const,
          person: targetSeat.person,
          fromDesk: targetSeat.desk_number,
          fromSeat: targetSeat.seat_number,
          toDesk: dragData.sourceDesk,
          toSeat: dragData.sourceSeat
        })
      }
    } else if (dragData.type === 'person') {
      // 从备选区拖拽到座位
      operations.push({
        type: 'assign' as const,
        person: dragData.person,
        toDesk: targetSeat.desk_number,
        toSeat: targetSeat.seat_number
      })

      // 如果目标座位有人，将其移到备选区
      if (targetSeat.person) {
        operations.push({
          type: 'unassign' as const,
          person: targetSeat.person,
          fromDesk: targetSeat.desk_number,
          fromSeat: targetSeat.seat_number
        })
      }
    }

    return operations
  }

  // ============ 工具函数 ============

  /**
   * 获取拖拽统计信息
   */
  const getDragStats = () => {
    const duration = dragStats.lastMoveTime - dragStats.startTime
    return {
      totalMoves: dragStats.totalMoves,
      lastDuration: duration,
      isActive: isDragging.value
    }
  }

  /**
   * 重置拖拽统计
   */
  const resetDragStats = () => {
    dragStats.totalMoves = 0
    dragStats.startTime = 0
    dragStats.lastMoveTime = 0
  }

  /**
   * 添加拖拽样式类
   */
  const addDragStyles = (element: HTMLElement, type: 'dragging' | 'drop-target' | 'drag-over') => {
    element.classList.add(type)
  }

  /**
   * 移除拖拽样式类
   */
  const removeDragStyles = (element: HTMLElement, type?: 'dragging' | 'drop-target' | 'drag-over') => {
    if (type) {
      element.classList.remove(type)
    } else {
      element.classList.remove('dragging', 'drop-target', 'drag-over')
    }
  }

  // ============ 返回接口 ============
  return {
    // 状态
    isDragging: readonly(isDragging),
    draggedItem: readonly(draggedItem),
    dropTarget: readonly(dropTarget),
    
    // 拖拽操作
    startSeatDrag,
    startPersonDrag,
    endDrag,
    handleDragOver,
    handleDragLeave,
    
    // 数据处理
    createDragData,
    parseDragData,
    
    // 座位交换
    canDropOnSeat,
    createSeatSwapOperation,
    
    // 样式管理
    addDragStyles,
    removeDragStyles,
    
    // 统计和工具
    getDragStats,
    resetDragStats
  }
}

// ============ 类型导出 ============
export interface SeatSwapOperation {
  type: 'move' | 'assign' | 'unassign'
  person: PersonWithAssignment
  fromDesk?: number
  fromSeat?: number
  toDesk?: number
  toSeat?: number
}

// 导入readonly工具
import { readonly } from 'vue'
