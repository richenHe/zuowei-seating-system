<template>
  <div class="bg-card rounded-lg border border-border p-6 shadow-sm">
    <!-- 标题 -->
    <div class="flex items-center space-x-2 mb-6">
      <div class="text-lg">📋</div>
      <h3 class="text-lg font-semibold text-card-foreground">配置面板</h3>
    </div>

    <!-- 配置表单 -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      
      <!-- 配置输入区域 - 横向布局 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        
        <!-- 桌子数量 -->
        <div class="space-y-2">
          <label for="desk-count" class="block text-sm font-medium text-foreground">
            桌子数量
          </label>
          <div class="relative">
            <input
              id="desk-count"
              v-model.number="formData.desk_count"
              type="number"
              min="1"
              max="50"
              :disabled="loading"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="输入桌子数量"
            />
            <div class="absolute right-3 top-2 text-xs text-muted-foreground">
              1-50
            </div>
          </div>
          <div v-if="errors.desk_count" class="text-xs text-destructive">
            {{ errors.desk_count }}
          </div>
        </div>

        <!-- 每桌座位数 -->
        <div class="space-y-2">
          <label for="seats-per-desk" class="block text-sm font-medium text-foreground">
            每桌座位数
          </label>
          <div class="relative">
            <input
              id="seats-per-desk"
              v-model.number="formData.seats_per_desk"
              type="number"
              min="4"
              max="12"
              :disabled="loading"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="输入每桌座位数"
            />
            <div class="absolute right-3 top-2 text-xs text-muted-foreground">
              4-12
            </div>
          </div>
          <div v-if="errors.seats_per_desk" class="text-xs text-destructive">
            {{ errors.seats_per_desk }}
          </div>
          <!-- 座位布局预览提示 -->
          <div class="text-xs text-muted-foreground">
            座位将围绕圆桌环形排列
          </div>
        </div>

        <!-- 列数 -->
        <div class="space-y-2">
          <label for="display-columns" class="block text-sm font-medium text-foreground">
            列数
          </label>
          <div class="relative">
            <input
              id="display-columns"
              v-model.number="formData.display_columns"
              type="number"
              min="3"
              max="10"
              :disabled="loading"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="3"
            />
            <div class="absolute right-3 top-2 text-xs text-muted-foreground">
              3-10
            </div>
          </div>
          <div v-if="errors.display_columns" class="text-xs text-destructive">
            {{ errors.display_columns }}
          </div>
          <!-- 列数说明 -->
          <div class="text-xs text-muted-foreground">
            1-3列充满区域，超过3列可滚动
          </div>
        </div>

        <!-- 桌布颜色 -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-foreground">
            桌布颜色
          </label>
          <div class="space-y-3">
            <!-- 预设颜色选择 -->
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="color in predefinedColors"
                :key="color.name"
                type="button"
                @click="selectTableColor(color.value)"
                :class="[
                  'w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110',
                  selectedTableColor === color.value 
                    ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                    : 'border-gray-300 hover:border-gray-400'
                ]"
                :style="{ backgroundColor: color.value }"
                :title="color.name"
              />
            </div>
            
            <!-- 自定义颜色选择器 -->
            <div class="flex items-center space-x-2">
              <input
                type="color"
                v-model="selectedTableColor"
                @change="handleColorChange"
                class="w-8 h-8 rounded border border-input cursor-pointer"
                title="自定义颜色"
              />
              <span class="text-xs text-muted-foreground">自定义颜色</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">操作</div>
          <button
            type="submit"
            :disabled="loading || !isValid || !hasChanges"
            class="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <div class="flex items-center space-x-2">
              <span>{{ loading ? '应用中...' : '应用配置' }}</span>
            </div>
          </button>
        </div>
        
      </div>


    </form>


  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import type { Config, ConfigUpdateRequest } from '@/types'

// ============ Props ============
interface Props {
  config: Config | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// ============ Emits ============
interface Emits {
  (e: 'update-config', config: ConfigUpdateRequest): void
  (e: 'update-table-color', color: string): void
}

const emit = defineEmits<Emits>()

// ============ 响应式状态 ============
const formData = reactive<ConfigUpdateRequest>({
  desk_count: 4,
  seats_per_desk: 8,
  display_columns: undefined,  // 默认3列
  table_cloth_color: '#e2e8f0'  // 桌布颜色
})

const errors = reactive<Record<string, string>>({})

// 桌布颜色相关状态
const selectedTableColor = ref('#e2e8f0') // 默认灰蓝色

// 预定义颜色选项
const predefinedColors = [
  { name: '经典灰蓝', value: '#e2e8f0' },
  { name: '温暖米色', value: '#f5f5dc' },
  { name: '薄荷绿', value: '#98fb98' },
  { name: '淡粉色', value: '#ffc0cb' },
  { name: '浅紫色', value: '#dda0dd' },
  { name: '天空蓝', value: '#87ceeb' },
  { name: '珊瑚橙', value: '#ffa07a' },
  { name: '柠檬黄', value: '#fffacd' },
  { name: '薰衣草', value: '#e6e6fa' },
  { name: '海蓝色', value: '#b0e0e6' },
  { name: '桃花粉', value: '#ffe4e1' },
  { name: '薄荷奶油', value: '#f0fff0' }
]

// ============ 计算属性 ============
const totalSeats = computed(() => {
  return (formData.desk_count || 0) * (formData.seats_per_desk || 0)
})

const hasChanges = computed(() => {
  if (!props.config) return true
  return formData.desk_count !== props.config.desk_count ||
         formData.seats_per_desk !== props.config.seats_per_desk ||
         formData.display_columns !== props.config.display_columns ||
         formData.table_cloth_color !== (props.config.table_cloth_color || '#e2e8f0')
})

const isValid = computed(() => {
  return Object.keys(errors).length === 0 &&
         formData.desk_count > 0 &&
         formData.seats_per_desk > 0
})

// ============ 监听器 ============

// 监听配置变更，同步到表单
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    formData.desk_count = newConfig.desk_count
    formData.seats_per_desk = newConfig.seats_per_desk
    formData.display_columns = newConfig.display_columns
    formData.table_cloth_color = newConfig.table_cloth_color || '#e2e8f0'
    selectedTableColor.value = newConfig.table_cloth_color || '#e2e8f0'
  }
}, { immediate: true })

// 监听表单数据变更，进行验证
watch(formData, () => {
  validateForm()
}, { deep: true })

// 监听桌布颜色选择器变更，同步到表单数据
watch(selectedTableColor, (newColor) => {
  formData.table_cloth_color = newColor
})

// ============ 生命周期 ============
onMounted(() => {
  validateForm()
})

// ============ 表单验证 ============

/**
 * 验证表单数据
 */
const validateForm = () => {
  // 清空之前的错误
  Object.keys(errors).forEach(key => {
    delete errors[key]
  })
  
  // 验证桌子数量
  if (!formData.desk_count || formData.desk_count < 1) {
    errors.desk_count = '桌子数量不能小于1'
  } else if (formData.desk_count > 50) {
    errors.desk_count = '桌子数量不能超过50'
  }
  
  // 验证每桌座位数
  if (!formData.seats_per_desk || formData.seats_per_desk < 4) {
    errors.seats_per_desk = '每桌座位数不能少于4个'
  } else if (formData.seats_per_desk > 12) {
    errors.seats_per_desk = '每桌座位数不能超过12个'
  }
  
  // 验证列数（可选）
  if (formData.display_columns !== undefined && formData.display_columns !== null) {
    if (formData.display_columns < 3) {
      errors.display_columns = '列数不能少于3列'
    } else if (formData.display_columns > 10) {
      errors.display_columns = '列数不能超过10列'
    }
  }
  
  // 验证总座位数限制
  if (totalSeats.value > 1000) {
    errors.desk_count = '总座位数不能超过1000个'
  }
}

// ============ 事件处理 ============

/**
 * 处理表单提交
 */
const handleSubmit = () => {
  if (!isValid.value || !hasChanges.value) return
  
  emit('update-config', {
    desk_count: formData.desk_count,
    seats_per_desk: formData.seats_per_desk,
    display_columns: formData.display_columns,
    table_cloth_color: formData.table_cloth_color
  })
}

/**
 * 选择桌布颜色
 */
const selectTableColor = (color: string) => {
  selectedTableColor.value = color
  formData.table_cloth_color = color
  // 保持兼容性，仍然发射事件供父组件实时更新显示
  emit('update-table-color', color)
}

/**
 * 处理自定义颜色变更
 */
const handleColorChange = () => {
  formData.table_cloth_color = selectedTableColor.value
  // 保持兼容性，仍然发射事件供父组件实时更新显示
  emit('update-table-color', selectedTableColor.value)
}

// ============ 工具函数 ============
</script>
