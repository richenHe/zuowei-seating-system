<template>
  <div 
    v-if="visible"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="handleCancel"
  >
    <div class="bg-card rounded-lg p-6 w-full max-w-4xl mx-4 border border-border shadow-lg max-h-[80vh] flex flex-col">
      <!-- 标题 -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <div class="text-lg">👥</div>
          <h4 class="text-lg font-semibold text-card-foreground">
            选择人员
          </h4>
        </div>
        <button
          @click="handleCancel"
          class="text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索人员姓名或学号..."
          class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <!-- 人员列表区域（可滚动） -->
      <div class="flex-1 overflow-hidden">
        <!-- 空状态 -->
        <div v-if="filteredPersons.length === 0" class="text-center py-8">
          <div class="text-3xl mb-2">🔍</div>
          <div class="text-sm text-muted-foreground">
            {{ searchQuery ? '未找到匹配的人员' : '暂无待排座人员' }}
          </div>
          <div v-if="searchQuery" class="text-xs text-muted-foreground mt-1">
            请尝试其他关键词
          </div>
        </div>

        <!-- 人员网格 -->
        <div v-else class="overflow-y-auto max-h-[50vh]">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-2">
            <div
              v-for="person in paginatedPersons"
              :key="person.id"
              class="person-card cursor-pointer group"
              @click="handlePersonSelect(person)"
              :title="`点击选择 ${person.name}`"
            >
              <!-- 人员头像区域 -->
              <div class="flex flex-col items-center space-y-2">
                <!-- 头像 -->
                <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-2 border-blue-300 group-hover:border-blue-500 transition-colors">
                  <span class="text-blue-600 font-semibold text-sm">
                    {{ person.name.charAt(0) }}
                  </span>
                </div>
                
                <!-- 人员信息 -->
                <div class="text-center">
                  <div class="font-semibold text-xs text-foreground leading-tight mb-1">
                    {{ person.name }}
                  </div>
                  <div v-if="person.student_id" class="text-xs text-muted-foreground">
                    {{ person.student_id }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页器 -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-border mt-4">
        <div class="text-sm text-muted-foreground">
          共 {{ filteredPersons.length }} 人，第 {{ currentPage }} / {{ totalPages }} 页
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <span class="text-sm text-muted-foreground px-2">{{ currentPage }}</span>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="flex items-center justify-between pt-4 border-t border-border mt-4">
        <div class="text-sm text-muted-foreground">
          点击人员卡片进行选择
        </div>
        <button
          @click="handleCancel"
          class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PersonWithAssignment, SeatInfo } from '@/types'

// ============ Props ============
interface Props {
  visible: boolean
  waitingPersons: PersonWithAssignment[]
  targetSeat: SeatInfo
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  waitingPersons: () => [],
  targetSeat: () => ({
    desk_number: 0,
    seat_number: 0,
    person: undefined
  })
})

// ============ Emits ============
interface Emits {
  (e: 'close'): void
  (e: 'select', data: { person: PersonWithAssignment, seat: SeatInfo }): void
}

const emit = defineEmits<Emits>()

// ============ 响应式状态 ============
const currentPage = ref(1)                      // 当前页码
const pageSize = 20                             // 每页显示20个人员
const searchQuery = ref('')                     // 搜索关键词

// ============ 计算属性 ============

/**
 * 过滤后的人员列表（根据搜索关键词）
 */
const filteredPersons = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.waitingPersons
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return props.waitingPersons.filter(person => 
    person.name.toLowerCase().includes(query) ||
    (person.student_id && person.student_id.toLowerCase().includes(query))
  )
})

/**
 * 总页数
 */
const totalPages = computed(() => 
  Math.ceil(filteredPersons.value.length / pageSize)
)

/**
 * 当前页的人员列表
 */
const paginatedPersons = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize
  const endIndex = startIndex + pageSize
  return filteredPersons.value.slice(startIndex, endIndex)
})

// ============ 方法 ============

/**
 * 跳转到指定页面
 */
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

/**
 * 处理人员选择
 */
const handlePersonSelect = (person: PersonWithAssignment) => {
  emit('select', { 
    person, 
    seat: props.targetSeat 
  })
  
  console.log(`✅ 选择人员: ${person.name}`)
}

/**
 * 处理取消操作
 */
const handleCancel = () => {
  emit('close')
}

// ============ 监听器 ============

/**
 * 监听可见状态变化，重置分页和搜索
 */
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    currentPage.value = 1
    searchQuery.value = ''
  }
})

/**
 * 监听搜索关键词变化，重置到第一页
 */
watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<style scoped>
/* 人员卡片样式 */
.person-card {
  @apply bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-lg p-3 transition-all duration-200 hover:from-yellow-100 hover:to-yellow-200 hover:border-yellow-300 hover:shadow-md hover:scale-105;
}

.person-card:hover {
  transform: translateY(-2px) scale(1.02);
}

/* 滚动条样式 */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
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
    @apply p-2;
  }
  
  .person-card .font-semibold {
    font-size: 0.75rem;
  }
  
  .person-card .text-xs {
    font-size: 0.7rem;
  }
}
</style>
