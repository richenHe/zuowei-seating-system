<template>
  <div class="bg-card rounded-lg border border-border p-6 shadow-sm">
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <div class="text-lg">⏳</div>
        <h3 class="text-lg font-semibold text-card-foreground">备选区域</h3>
      </div>
      
      <!-- 人数统计 -->
      <div class="text-sm text-muted-foreground">
        {{ waitingPersons.length }} 人待排座
      </div>
    </div>

    <!-- 拖拽提示 -->
    <div class="mb-4 text-xs text-muted-foreground">
      💡 拖拽人员到座位区进行排座，或从座位区拖拽到此处
    </div>

    <!-- 备选区域 -->
    <div
      ref="waitingAreaRef"
      class="waiting-zone min-h-32 p-4 border-2 border-dashed border-border rounded-lg bg-muted/20 transition-colors duration-200"
      :class="{ 'drag-over': isDragOver }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- 空状态 -->
      <div v-if="waitingPersons.length === 0" class="text-center py-8">
        <div class="text-3xl mb-2">👥</div>
        <div class="text-sm text-muted-foreground">暂无待排座人员</div>
        <div class="text-xs text-muted-foreground mt-1">
          所有人员都已安排座位
        </div>
      </div>

      <!-- 人员卡片 -->
      <div v-else class="space-y-4">
        <div class="flex flex-wrap gap-3">
          <div
            v-for="person in paginatedPersons"
            :key="person.id"
            class="person-card draggable"
            :draggable="!loading"
            @dragstart="handlePersonDragStart($event, person)"
            @dragend="handlePersonDragEnd"
            @click="handlePersonClick(person)"
          >
            <!-- 人员信息 -->
            <div class="text-center">
              <div class="font-semibold text-xs leading-tight mb-1">
                {{ person.name }}
              </div>
              <div v-if="person.student_id" class="text-xs opacity-80">
                {{ person.student_id }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 分页器 -->
        <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-border">
          <div class="text-xs text-muted-foreground">
            共 {{ waitingPersons.length }} 人，第 {{ currentPage }} / {{ totalPages }} 页
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage <= 1 || loading"
              class="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <span class="text-xs text-muted-foreground">{{ currentPage }}</span>
            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage >= totalPages || loading"
              class="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>


    <!-- 人员详情模态框 -->
    <div
      v-if="selectedPerson"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closePersonDetail"
    >
      <div class="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-border shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-card-foreground">人员信息</h4>
          <button
            @click="closePersonDetail"
            class="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        
        <div class="space-y-3">
          <div>
            <div class="text-sm font-medium text-foreground">姓名</div>
            <div class="text-lg">{{ selectedPerson.name }}</div>
          </div>
          
          <div v-if="selectedPerson.student_id">
            <div class="text-sm font-medium text-foreground">学号/工号</div>
            <div>{{ selectedPerson.student_id }}</div>
          </div>
          
          <div v-if="selectedPerson.info">
            <div class="text-sm font-medium text-foreground">其他信息</div>
            <div class="text-sm text-muted-foreground">{{ selectedPerson.info }}</div>
          </div>
          
          <div class="text-sm text-muted-foreground">
            状态：在备选区，等待排座
          </div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <button
            @click="closePersonDetail"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PersonWithAssignment } from '@/types'
import { useDragAndDrop } from '@/composables/useDragAndDrop'

// ============ Props ============
interface Props {
  waitingPersons: PersonWithAssignment[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// ============ Emits ============
interface Emits {
  (e: 'person-drop', data: { person: PersonWithAssignment, source: string }): void
  (e: 'person-drag-start', person: PersonWithAssignment): void
  (e: 'random-assign', persons: PersonWithAssignment[]): void
}

const emit = defineEmits<Emits>()

// ============ 拖拽组合函数 ============
const {
  startPersonDrag,
  endDrag,
  parseDragData
} = useDragAndDrop()

// ============ 响应式状态 ============
const isDragOver = ref(false)                    // 拖拽悬停状态
const waitingAreaRef = ref<HTMLElement>()        // 备选区域引用
const selectedPersons = ref(new Set<number>())   // 选中的人员ID
const selectedPerson = ref<PersonWithAssignment | null>(null) // 查看详情的人员

// ============ 分页相关 ============
const currentPage = ref(1)                      // 当前页码
const pageSize = 15                             // 每页显示15个

// ============ 计算属性 ============
const hasSelection = computed(() => selectedPersons.value.size > 0)

// 分页相关计算属性
const totalPages = computed(() => Math.ceil(props.waitingPersons.length / pageSize))

const paginatedPersons = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  return props.waitingPersons.slice(startIndex, endIndex)
})

// ============ 拖拽处理 ============

/**
 * 处理人员拖拽开始
 */
const handlePersonDragStart = (event: DragEvent, person: PersonWithAssignment) => {
  if (props.loading) return
  
  // 使用拖拽组合函数处理人员拖拽
  const success = startPersonDrag(event, person)
  
  if (success) {
    // 添加拖拽样式
    if (event.target instanceof HTMLElement) {
      event.target.classList.add('dragging')
    }
    
    emit('person-drag-start', person)
    console.log('✅ 人员拖拽开始成功:', person.name)
  } else {
    console.warn('⚠️ 人员拖拽开始失败')
  }
}

/**
 * 处理人员拖拽结束
 */
const handlePersonDragEnd = (event: DragEvent) => {
  // 使用拖拽组合函数处理拖拽结束
  endDrag()
  
  // 移除拖拽样式
  if (event.target instanceof HTMLElement) {
    event.target.classList.remove('dragging')
  }
}

/**
 * 处理拖拽悬停
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  
  isDragOver.value = true
  console.log('🎯 拖拽悬停在备选区域上')
}

/**
 * 处理拖拽离开
 */
const handleDragLeave = (event: DragEvent) => {
  // 检查是否真的离开了备选区域
  if (event.target === waitingAreaRef.value && !waitingAreaRef.value?.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

/**
 * 处理拖拽放置
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  console.log('🎯 检测到拖拽放置在备选区域')
  
  if (!event.dataTransfer) {
    console.warn('⚠️ 无效的 dataTransfer')
    return
  }
  
  // 使用拖拽组合函数解析拖拽数据
  const dragData = parseDragData(event.dataTransfer)
  console.log('🔍 解析的拖拽数据:', dragData)
  
  if (!dragData) {
    console.warn('⚠️ 无效的拖拽数据')
    return
  }
  
  if (dragData.type === 'seat' && dragData.person) {
    // 从座位拖拽到备选区
    console.log('🎯 座位人员拖拽到备选区:', dragData.person.name)
    emit('person-drop', {
      person: dragData.person,
      source: 'seat'
    })
  } else {
    console.warn('⚠️ 不支持的拖拽类型:', dragData.type, '数据:', dragData)
  }
}

// ============ 交互处理 ============

/**
 * 处理人员点击
 */
const handlePersonClick = (person: PersonWithAssignment) => {
  selectedPerson.value = person
}

/**
 * 关闭人员详情
 */
const closePersonDetail = () => {
  selectedPerson.value = null
}

/**
 * 全选/取消全选
 */
const selectAll = () => {
  if (selectedPersons.value.size === props.waitingPersons.length) {
    // 取消全选
    selectedPersons.value.clear()
  } else {
    // 全选
    selectedPersons.value = new Set(props.waitingPersons.map(p => p.id))
  }
}

/**
 * 清空选择
 */
const clearSelection = () => {
  selectedPersons.value.clear()
}

/**
 * 随机分配座位
 */
const randomAssign = () => {
  if (props.waitingPersons.length === 0) return
  
  const personsToAssign = hasSelection.value 
    ? props.waitingPersons.filter(p => selectedPersons.value.has(p.id))
    : props.waitingPersons
    
  if (!confirm(`确定要随机为 ${personsToAssign.length} 人分配座位吗？`)) {
    return
  }
  
  emit('random-assign', personsToAssign)
  
  // 清空选择
  selectedPersons.value.clear()
}

// ============ 分页方法 ============
/**
 * 跳转到指定页面
 */
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}
</script>

<style scoped>
/* 人员卡片样式 */
.person-card {
  @apply relative bg-yellow-100 border-2 border-yellow-200 rounded-lg p-3 cursor-pointer transition-all duration-200 min-w-16 min-h-16 flex flex-col items-center justify-center;
}

.person-card:hover {
  @apply bg-yellow-200 border-yellow-300 shadow-md transform -translate-y-1;
}

.person-card.dragging {
  @apply opacity-60 scale-95 rotate-3;
}

/* 拖拽提示图标 */
.drag-hint {
  @apply absolute top-1 right-1 text-yellow-600 opacity-50;
}

.person-card:hover .drag-hint {
  @apply opacity-100;
}

/* 备选区域拖拽状态 */
.waiting-zone.drag-over {
  @apply border-primary bg-primary/5 border-solid;
}

/* 选中状态 */
.person-card.selected {
  @apply bg-blue-100 border-blue-300;
}

/* 动画效果 */
.person-card {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式调整 */
@media (max-width: 640px) {
  .person-card {
    @apply min-w-14 min-h-14 p-2;
  }
  
  .person-card .font-semibold {
    font-size: 0.75rem;
  }
  
  .person-card .text-xs {
    font-size: 0.75rem;
  }
}
</style>
