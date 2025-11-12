<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="bg-card border-b border-border shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="text-2xl">🪑</div>
          <h1 class="text-xl font-semibold text-foreground">排座位表系统</h1>
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- 加载状态指示器 -->
          <div v-if="loading || isSaving" class="flex items-center space-x-2 text-sm text-muted-foreground">
            <div class="w-4 h-4 loading-spinner"></div>
            <span>{{ isSaving ? '保存中...' : '加载中...' }}</span>
          </div>
          
          <!-- 保存按钮 -->
          <button
            v-if="hasChanges && !loading && !isSaving"
            @click="saveAllChanges"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            💾 保存更改 ({{ pendingChanges.size }})
          </button>
        </div>
      </div>
    </header>

    <!-- 错误提示 -->
    <div v-if="error" class="container mx-auto px-4 py-2">
      <div class="error-message">
        <div class="flex items-center space-x-2">
          <div class="text-lg">⚠️</div>
          <div>
            <div class="font-medium">操作失败</div>
            <div class="text-sm">{{ error }}</div>
          </div>
          <button @click="clearError" class="ml-auto text-destructive hover:text-destructive/80">
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="successMessage" class="container mx-auto px-4 py-2">
      <div class="success-message">
        <div class="flex items-center space-x-2">
          <div class="text-lg">✅</div>
          <div class="font-medium">{{ successMessage }}</div>
          <button @click="clearSuccess" class="ml-auto text-green-800 hover:text-green-600">
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 - 优化为上中下布局 -->
    <main class="container mx-auto px-4 py-6 space-y-8">
      
      <!-- 顶部：配置面板和人员管理并排 -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-7xl mx-auto items-stretch">
        <!-- 左侧：配置面板和功能模块区域（占2列） -->
        <div class="lg:col-span-2 flex flex-col">
          <!-- 配置面板 -->
          <ConfigPanel
            :config="config"
            :loading="loading"
            @update-config="handleConfigUpdate"
            @update-table-color="handleTableColorUpdate"
          />
          
          <!-- 功能模块：放在配置面板下方，填充剩余空间 -->
          <div class="flex-1 mt-6">
            <FunctionsPanel
              :loading="loading"
              @show-message="handleShowMessage"
            />
          </div>
        </div>
        
        <!-- 右侧：人员管理（占3列） -->
        <div class="lg:col-span-3">
          <PersonManager
          :persons="persons"
          :ambassadors="ambassadors"
          :loading="loading"
          @add-person="handleAddPerson"
          @update-person="handleUpdatePerson"
          @delete-person="handleDeletePerson"
          @batch-delete-persons="handleBatchDeletePersons"
          @add-ambassador="handleAddAmbassador"
          @update-ambassador="handleUpdateAmbassador"
          @delete-ambassador="handleDeleteAmbassador"
          @batch-delete-ambassadors="handleBatchDeleteAmbassadors"
          />
        </div>
      </div>

      <!-- 中间：座位区域（增加间距和边距） -->
      <div class="w-full py-8 px-4">
        <SeatingArea
          :layout="layout"
          :config="config"
          :loading="loading"
          :table-color="tableColor"
          :waiting-persons="waitingPersons"
          @seat-drop="handleSeatDrop"
          @seat-click="handleSeatClick"
          @person-assign="handlePersonAssign"
          @add-to-waiting="handleAddToWaiting"
        />
      </div>

      <!-- 底部：备选区域 -->
      <div class="max-w-4xl mx-auto">
        <WaitingArea
          :waiting-persons="waitingPersons"
          :loading="loading"
          @person-drop="handlePersonDrop"
          @person-drag-start="handlePersonDragStart"
          @random-assign="handleRandomAssign"
        />
      </div>
    </main>

    <!-- 底部信息 -->
    <footer class="border-t border-border bg-muted/30 py-4 mt-8">
      <div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <div>排座位表系统 v1.0.0 | 共 {{ totalPersons }} 人，{{ assignedPersons }} 人已排座</div>
        <div v-if="lastSaved">最后保存：{{ formatTime(lastSaved) }}</div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ConfigPanel from './components/ConfigPanel.vue'
import PersonManager from './components/PersonManager.vue'
import SeatingArea from './components/SeatingArea.vue'
import WaitingArea from './components/WaitingArea.vue'
import FunctionsPanel from './components/FunctionsPanel.vue'

// API导入
import {
  getConfig,
  updateConfig,
  getPersons,
  createPerson,
  updatePerson,
  deletePerson,
  batchDeletePersons,
  getSeatingLayout,
  updateAssignments,
  getAmbassadors,
  createAmbassador,
  updateAmbassador,
  deleteAmbassador,
  batchDeleteAmbassadors,
  handleApiError
} from '@/api'

// 类型导入
import type {
  Config,
  PersonWithAssignment,
  DeskLayout,
  SeatInfo,
  ConfigUpdateRequest,
  PersonCreateRequest,
  PersonUpdateRequest,
  AssignmentUpdateRequest,
  Ambassador,
  AmbassadorCreateRequest,
  AmbassadorUpdateRequest
} from '@/types'

// ============ 响应式状态 ============
const loading = ref(false)               // 加载状态
const error = ref<string | null>(null)   // 错误信息
const successMessage = ref<string | null>(null) // 成功信息
const hasChanges = ref(false)            // 是否有未保存的变更
const lastSaved = ref<Date | null>(null) // 最后保存时间

// 数据状态
const config = ref<Config | null>(null)  // 当前配置
const persons = ref<PersonWithAssignment[]>([]) // 所有人员（已保存状态）
const ambassadors = ref<Ambassador[]>([]) // 所有传播大使（已保存状态）
const layout = ref<DeskLayout[]>([])     // 座位布局（临时状态，包含拖拽变更）
const waitingPersons = ref<PersonWithAssignment[]>([]) // 备选区人员（临时状态）
const tableColor = ref('#e2e8f0')        // 桌布颜色

// 临时座位分配状态（用于座位区域显示，但不影响人员列表）
const tempAssignments = ref(new Map<number, AssignmentUpdateRequest>()) // 临时分配状态

// ============ 批量保存相关状态 ============
const pendingChanges = ref(new Map<number, AssignmentUpdateRequest>()) // 待保存的变更
const isSaving = ref(false)              // 是否正在保存

// ============ 计算属性 ============
const totalPersons = computed(() => persons.value.length)
const assignedPersons = computed(() => 
  persons.value.filter(p => p.desk_number !== undefined && p.seat_number !== undefined).length
)

// ============ 生命周期 ============
onMounted(async () => {
  await loadAllData()
})

// ============ 数据加载 ============

/**
 * 加载所有数据
 */
const loadAllData = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 并行加载配置、座位布局、人员数据和传播大使数据
    const [configData, layoutData, personsData, ambassadorsData] = await Promise.all([
      getConfig(),
      getSeatingLayout(),
      getPersons(),
      getAmbassadors()
    ])
    
    config.value = configData
    layout.value = layoutData.layout
    waitingPersons.value = layoutData.waiting
    persons.value = personsData
    ambassadors.value = ambassadorsData
    
    // 同步桌布颜色到本地状态
    if (configData.table_cloth_color) {
      tableColor.value = configData.table_cloth_color
    }
    
    // 清空临时分配状态并重新构建布局
    tempAssignments.value.clear()
    rebuildLayoutFromPersons()
    
    console.log('✅ 数据加载完成')
  } catch (err) {
    error.value = handleApiError(err)
    console.error('❌ 数据加载失败:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 重新加载座位布局和人员数据
 */
const reloadLayout = async () => {
  try {
    const [layoutData, personsData] = await Promise.all([
      getSeatingLayout(),
      getPersons()
    ])
    
    layout.value = layoutData.layout
    waitingPersons.value = layoutData.waiting
    persons.value = personsData // 重新加载人员数据以更新座位状态
    hasChanges.value = false
    
    // 清空临时分配状态
    tempAssignments.value.clear()
  } catch (err) {
    error.value = handleApiError(err)
  }
}

// ============ 配置管理 ============

/**
 * 处理桌布颜色更新
 */
const handleTableColorUpdate = (color: string) => {
  tableColor.value = color
  console.log('🎨 桌布颜色已更新:', color)
}

/**
 * 处理配置变更后的座位重新分配
 */
const handleConfigChange = async (newConfig: ConfigUpdateRequest) => {
  try {
    // 获取当前所有座位分配
    const currentLayout = layout.value
    const needReassignment: AssignmentUpdateRequest[] = []
    
    // 检查哪些人员需要重新分配（超出新桌子数量范围）
    currentLayout.forEach(desk => {
      if (desk.desk_number > newConfig.desk_count) {
        // 这个桌子超出了新的桌子数量，所有人员需要移到备选区
        desk.seats.forEach(seat => {
          if (seat.person) {
            needReassignment.push({
              person_id: seat.person.id,
              desk_number: null,  // 移到备选区
              seat_number: null
            })
            console.log(`👥 将 ${seat.person.name} 从桌${desk.desk_number}移到备选区`)
          }
        })
      } else {
        // 桌子保留，但检查座位数是否超出范围
        desk.seats.forEach(seat => {
          if (seat.person && seat.seat_number > newConfig.seats_per_desk) {
            needReassignment.push({
              person_id: seat.person.id,
              desk_number: null,  // 移到备选区
              seat_number: null
            })
            console.log(`👥 将 ${seat.person.name} 从桌${desk.desk_number}座${seat.seat_number}移到备选区（超出座位数）`)
          }
        })
      }
    })
    
    // 如果有需要重新分配的人员，执行批量更新
    if (needReassignment.length > 0) {
      await updateAssignments({ assignments: needReassignment })
      successMessage.value = `已将 ${needReassignment.length} 人移至备选区`
      console.log(`✅ 配置变更：${needReassignment.length} 人已移至备选区`)
    }
    
    // 配置更改后清空待保存的变更（因为配置更改会立即生效）
    pendingChanges.value.clear()
    hasChanges.value = false
    
  } catch (err) {
    console.error('❌ 处理配置变更失败:', err)
    throw err
  }
}

/**
 * 处理配置更新
 */
const handleConfigUpdate = async (newConfig: ConfigUpdateRequest) => {
  loading.value = true
  error.value = null
  
  try {
    const updated = await updateConfig(newConfig)
    config.value = updated
    
    // 同步桌布颜色到本地状态
    if (updated.table_cloth_color) {
      tableColor.value = updated.table_cloth_color
    }
    
    // 配置变更后需要处理超出范围的座位分配
    await handleConfigChange(newConfig)
    
    // 重新加载布局
    await reloadLayout()
    
    successMessage.value = `配置已更新：${newConfig.desk_count}桌 x ${newConfig.seats_per_desk}座位`
    lastSaved.value = new Date()
    
    console.log('✅ 配置更新成功')
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

// ============ 人员管理 ============

/**
 * 添加人员
 */
const handleAddPerson = async (personData: PersonCreateRequest) => {
  loading.value = true
  error.value = null
  
  try {
    const newPerson = await createPerson(personData)
    
    // 添加到本地状态
    const personWithAssignment: PersonWithAssignment = {
      ...newPerson,
      desk_number: undefined,
      seat_number: undefined
    }
    
    persons.value.push(personWithAssignment)
    waitingPersons.value.push(personWithAssignment)
    
    successMessage.value = `已添加人员：${newPerson.name}`
    
    console.log('✅ 人员添加成功:', newPerson.name)
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

/**
 * 更新人员信息
 */
const handleUpdatePerson = async (id: number, personData: PersonUpdateRequest) => {
  loading.value = true
  error.value = null

  try {
    const updatedPerson = await updatePerson(id, personData)

    // 重新加载完整的人员数据以确保传播大使名称等信息正确
    const personsData = await getPersons()
    persons.value = personsData

    // 重新构建布局以同步所有显示的人员信息
    rebuildLayoutFromPersons()

    successMessage.value = `已更新人员：${updatedPerson.name}`

    console.log('✅ 人员更新成功:', updatedPerson.name)
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

/**
 * 删除人员
 */
const handleDeletePerson = async (id: number) => {
  const person = persons.value.find(p => p.id === id)
  if (!person) return
  
  if (!confirm(`确定要删除人员"${person.name}"吗？`)) {
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    await deletePerson(id)
    
    // 从本地状态移除
    persons.value = persons.value.filter(p => p.id !== id)
    waitingPersons.value = waitingPersons.value.filter(p => p.id !== id)
    
    // 重新加载布局以更新座位状态
    await reloadLayout()
    
    successMessage.value = `已删除人员：${person.name}`
    
    console.log('✅ 人员删除成功:', person.name)
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

/**
 * 批量删除人员
 */
const handleBatchDeletePersons = async (person_ids: number[]) => {
  if (person_ids.length === 0) return
  
  const selectedPersons = persons.value.filter(p => person_ids.includes(p.id))
  const selectedNames = selectedPersons.map(p => p.name)
  
  loading.value = true
  error.value = null
  
  try {
    const message = await batchDeletePersons(person_ids)
    
    // 重新加载所有数据以确保同步
    await reloadLayout()
    
    successMessage.value = message
    
    console.log(`✅ 批量删除成功: ${selectedNames.join('、')}`)
  } catch (err) {
    error.value = handleApiError(err)
    console.error('❌ 批量删除失败:', err)
  } finally {
    loading.value = false
  }
}

// ============ 传播大使管理 ============

/**
 * 添加传播大使
 */
const handleAddAmbassador = async (ambassadorData: AmbassadorCreateRequest) => {
  loading.value = true
  error.value = null
  
  try {
    const newAmbassador = await createAmbassador(ambassadorData)
    
    // 添加到本地状态
    ambassadors.value.push(newAmbassador)
    
    successMessage.value = `已添加传播大使：${newAmbassador.name}`
    
    console.log('✅ 传播大使添加成功:', newAmbassador.name)
  } catch (err) {
    error.value = handleApiError(err)
  } finally {
    loading.value = false
  }
}

/**
 * 更新传播大使信息
 */
const handleUpdateAmbassador = async (id: number, ambassadorData: AmbassadorUpdateRequest) => {
  loading.value = true
  error.value = null
  
  try {
    const updatedAmbassador = await updateAmbassador(id, ambassadorData)
    
    // 更新本地状态
    const index = ambassadors.value.findIndex(a => a.id === id)
    if (index !== -1) {
      ambassadors.value[index] = { ...ambassadors.value[index], ...updatedAmbassador }
    }
    
    // 重新加载人员数据以更新传播大使名称，并重新构建布局
    const personsData = await getPersons()
    persons.value = personsData
    rebuildLayoutFromPersons()
    
    successMessage.value = `已更新传播大使：${updatedAmbassador.name}`
    
    console.log('✅ 传播大使更新成功:', updatedAmbassador.name)
  } catch (err) {
    error.value = handleApiError(err)
    console.error('❌ 传播大使更新失败:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 删除传播大使
 */
const handleDeleteAmbassador = async (id: number) => {
  const ambassador = ambassadors.value.find(a => a.id === id)
  if (!ambassador) return
  
  loading.value = true
  error.value = null
  
  try {
    await deleteAmbassador(id)
    
    // 从本地状态移除
    const index = ambassadors.value.findIndex(a => a.id === id)
    if (index !== -1) {
      ambassadors.value.splice(index, 1)
    }
    
    // 重新加载人员数据，因为相关人员的ambassador_id已被设置为NULL
    const personsData = await getPersons()
    persons.value = personsData
    
    successMessage.value = `已删除传播大使：${ambassador.name}`
    
    console.log('✅ 传播大使删除成功:', ambassador.name)
  } catch (err) {
    error.value = handleApiError(err)
    console.error('❌ 传播大使删除失败:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 批量删除传播大使
 */
const handleBatchDeleteAmbassadors = async (ambassador_ids: number[]) => {
  if (ambassador_ids.length === 0) return
  
  const selectedAmbassadors = ambassadors.value.filter(a => ambassador_ids.includes(a.id))
  const selectedNames = selectedAmbassadors.map(a => a.name)
  
  loading.value = true
  error.value = null
  
  try {
    const message = await batchDeleteAmbassadors(ambassador_ids)
    
    // 从本地状态中移除被删除的传播大使
    selectedAmbassadors.forEach(ambassador => {
      const index = ambassadors.value.findIndex(a => a.id === ambassador.id)
      if (index !== -1) {
        ambassadors.value.splice(index, 1)
      }
    })
    
    // 重新加载人员数据，因为相关人员的ambassador_id已被设置为NULL
    const personsData = await getPersons()
    persons.value = personsData
    
    successMessage.value = message
    
    console.log(`✅ 批量删除传播大使成功: ${selectedNames.join('、')}`)
  } catch (err) {
    error.value = handleApiError(err)
    console.error('❌ 批量删除传播大使失败:', err)
  } finally {
    loading.value = false
  }
}

// ============ 本地状态更新函数 ============

/**
 * 更新本地状态以提供即时反馈（仅更新座位区域显示，不影响人员列表）
 */
const updateLocalState = (assignments: AssignmentUpdateRequest[]) => {
  console.log('🔄 开始更新本地状态:', assignments)
  assignments.forEach(assignment => {
    // 只更新临时分配状态，不修改persons数组
    tempAssignments.value.set(assignment.person_id, assignment)
    console.log('📝 设置临时分配:', assignment.person_id, assignment)
  })
  
  console.log('🗺️ 当前临时分配状态:', Array.from(tempAssignments.value.entries()))
  
  // 重新计算布局和备选区（基于临时状态）
  rebuildLayoutFromTempState()
  console.log('✅ 本地状态更新完成')
}

/**
 * 从临时分配状态重新构建布局（用于座位区域显示）
 */
const rebuildLayoutFromTempState = () => {
  console.log('🔨 开始重建布局，配置:', config.value)
  if (!config.value) return
  
  // 重置布局
  const newLayout: DeskLayout[] = []
  const newWaiting: PersonWithAssignment[] = []
  
  // 创建空布局
  for (let deskIndex = 1; deskIndex <= config.value.desk_count; deskIndex++) {
    const seats: SeatInfo[] = []
    for (let seatIndex = 1; seatIndex <= config.value.seats_per_desk; seatIndex++) {
      seats.push({
        desk_number: deskIndex,
        seat_number: seatIndex,
        person: undefined
      })
    }
    newLayout.push({
      desk_number: deskIndex,
      seats
    })
  }
  
  console.log('👥 处理人员分配，总人数:', persons.value.length)
  
  // 分配人员到座位或备选区（基于临时状态）
  persons.value.forEach(person => {
    // 检查是否有临时分配
    const tempAssignment = tempAssignments.value.get(person.id)
    let deskNumber: number | null = null
    let seatNumber: number | null = null
    
    if (tempAssignment) {
      // 如果有临时分配，使用临时分配的值（包括null）
      deskNumber = tempAssignment.desk_number ?? null
      seatNumber = tempAssignment.seat_number ?? null
    } else {
      // 如果没有临时分配，使用原始值
      deskNumber = person.desk_number ?? null
      seatNumber = person.seat_number ?? null
    }
    
    console.log(`🧑 处理 ${person.name}: 原始位置(${person.desk_number}, ${person.seat_number}), 临时位置(${tempAssignment?.desk_number}, ${tempAssignment?.seat_number}), 最终位置(${deskNumber}, ${seatNumber})`)
    
    if (deskNumber != null && seatNumber != null && 
        deskNumber >= 1 && deskNumber <= config.value!.desk_count &&
        seatNumber >= 1 && seatNumber <= config.value!.seats_per_desk) {
      // 分配到座位（需要转换为数组索引）
      newLayout[deskNumber - 1].seats[seatNumber - 1].person = person
      console.log(`✅ ${person.name} 分配到座位 桌${deskNumber}座${seatNumber}`)
    } else {
      // 加入备选区
      newWaiting.push(person)
      console.log(`📋 ${person.name} 加入备选区`)
    }
  })
  
  console.log('🎯 布局重建完成: 备选区人数=', newWaiting.length)
  layout.value = newLayout
  waitingPersons.value = newWaiting
}

/**
 * 从persons数据重新构建布局（用于初始加载和保存后同步）
 */
const rebuildLayoutFromPersons = () => {
  if (!config.value) return
  
  // 重置布局
  const newLayout: DeskLayout[] = []
  const newWaiting: PersonWithAssignment[] = []
  
  // 创建空布局
  for (let deskIndex = 1; deskIndex <= config.value.desk_count; deskIndex++) {
    const seats: SeatInfo[] = []
    for (let seatIndex = 1; seatIndex <= config.value.seats_per_desk; seatIndex++) {
      seats.push({
        desk_number: deskIndex,
        seat_number: seatIndex,
        person: undefined
      })
    }
    newLayout.push({
      desk_number: deskIndex,
      seats
    })
  }
  
  // 分配人员到座位或备选区（基于已保存的状态）
  persons.value.forEach(person => {
    if (person.desk_number != null && person.seat_number != null && 
        person.desk_number >= 1 && person.desk_number <= config.value!.desk_count &&
        person.seat_number >= 1 && person.seat_number <= config.value!.seats_per_desk) {
      // 分配到座位（需要转换为数组索引）
      newLayout[person.desk_number - 1].seats[person.seat_number - 1].person = person
    } else {
      // 加入备选区
      newWaiting.push(person)
    }
  })
  
  layout.value = newLayout
  waitingPersons.value = newWaiting
  
  // 清空临时分配状态
  tempAssignments.value.clear()
}

/**
 * 批量保存所有变更
 */
const saveAllChanges = async () => {
  if (pendingChanges.value.size === 0) return
  
  isSaving.value = true
  error.value = null
  
  try {
    const assignments = Array.from(pendingChanges.value.values())
    
    console.log(`💾 保存 ${assignments.length} 个座位分配变更...`)
    
    await updateAssignments({ assignments })
    
    // 保存成功后，将临时分配状态应用到persons数组
    assignments.forEach(assignment => {
      const personIndex = persons.value.findIndex(p => p.id === assignment.person_id)
      if (personIndex !== -1) {
        persons.value[personIndex].desk_number = assignment.desk_number
        persons.value[personIndex].seat_number = assignment.seat_number
      }
    })
    
    // 清空待保存变更和临时状态
    pendingChanges.value.clear()
    tempAssignments.value.clear()
    hasChanges.value = false
    lastSaved.value = new Date()
    
    // 重新加载数据以确保同步
    await reloadLayout()
    
    successMessage.value = `成功保存 ${assignments.length} 个座位分配`
    console.log('✅ 批量保存成功')
    
    // 自动清除成功消息
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = handleApiError(err)
    console.error('❌ 批量保存失败:', err)
  } finally {
    isSaving.value = false
  }
}

// ============ 拖拽处理 ============

/**
 * 处理座位拖拽
 */
const handleSeatDrop = (dropData: { seat: any, draggedPerson: PersonWithAssignment, dragType?: string, sourceDesk?: number, sourceSeat?: number }) => {
  error.value = null
  console.log('🪑 处理座位拖拽:', dropData.draggedPerson.name, '到座位', dropData.seat.desk_number, dropData.seat.seat_number, '拖拽类型:', dropData.dragType)
  
  try {
    // 记录待保存的变更
    const assignments: AssignmentUpdateRequest[] = []
    
    // 将拖拽的人员分配到目标座位
    const mainAssignment: AssignmentUpdateRequest = {
      person_id: dropData.draggedPerson.id,
      desk_number: dropData.seat.desk_number,
      seat_number: dropData.seat.seat_number
    }
    assignments.push(mainAssignment)
    pendingChanges.value.set(dropData.draggedPerson.id, mainAssignment)
    
    // 处理目标座位上的人员
    if (dropData.seat.person) {
      let displacedAssignment: AssignmentUpdateRequest
      
      // 检查拖拽类型来决定目标座位人员的去向
      if (dropData.dragType === 'seat' && dropData.sourceDesk !== undefined && dropData.sourceSeat !== undefined) {
        // 座位之间的交换：目标座位的人员移到源座位
        displacedAssignment = {
          person_id: dropData.seat.person.id,
          desk_number: dropData.sourceDesk,
          seat_number: dropData.sourceSeat
        }
        console.log(`🔄 座位交换: ${dropData.draggedPerson.name} ↔ ${dropData.seat.person.name}`)
      } else {
        // 从备选区拖拽到座位：目标座位的人员移到备选区
        displacedAssignment = {
          person_id: dropData.seat.person.id,
          desk_number: null,
          seat_number: null
        }
        console.log(`👥 ${dropData.seat.person.name} 被移到备选区`)
      }
      
      assignments.push(displacedAssignment)
      pendingChanges.value.set(dropData.seat.person.id, displacedAssignment)
    }
    
    // 立即更新本地状态以提供即时反馈
    updateLocalState(assignments)
    
    hasChanges.value = true
    
    // 根据拖拽类型显示不同的成功消息
    if (dropData.dragType === 'seat' && dropData.seat.person) {
      successMessage.value = `🔄 座位交换：${dropData.draggedPerson.name} ↔ ${dropData.seat.person.name}（待保存）`
    } else if (dropData.seat.person) {
      successMessage.value = `${dropData.draggedPerson.name} 已分配到座位，${dropData.seat.person.name} 移至备选区（待保存）`
    } else {
      successMessage.value = `${dropData.draggedPerson.name} 已分配到座位（待保存）`
    }
    
    console.log('✅ 座位拖拽成功，已加入待保存队列')
    
    // 自动清除成功消息
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = '更新座位分配失败'
    console.error('❌ 座位拖拽失败:', err)
  }
}

/**
 * 处理座位点击
 */
const handleSeatClick = (seatData: any) => {
  console.log('👆 座位点击:', seatData)
  // 可以在这里实现座位详情弹窗等功能
}

/**
 * 处理人员分配（从人员选择浮窗）
 */
const handlePersonAssign = (data: { person: PersonWithAssignment, seat: SeatInfo }) => {
  error.value = null
  
  try {
    // 构造分配请求
    const assignment: AssignmentUpdateRequest = {
      person_id: data.person.id,
      desk_number: data.seat.desk_number,
      seat_number: data.seat.seat_number
    }
    
    // 处理目标座位上已有的人员
    const assignments: AssignmentUpdateRequest[] = [assignment]
    
    if (data.seat.person) {
      // 如果座位已有人员，将其移到备选区
      const displacedAssignment: AssignmentUpdateRequest = {
        person_id: data.seat.person.id,
        desk_number: null,
        seat_number: null
      }
      assignments.push(displacedAssignment)
      pendingChanges.value.set(data.seat.person.id, displacedAssignment)
      console.log(`👥 ${data.seat.person.name} 被移到备选区`)
    }
    
    // 记录待保存的变更
    pendingChanges.value.set(data.person.id, assignment)
    
    // 立即更新本地状态以提供即时反馈
    updateLocalState(assignments)
    
    hasChanges.value = true
    successMessage.value = `${data.person.name} 已分配到座位（待保存）`
    console.log('✅ 人员分配成功，已加入待保存队列')
    
    // 自动清除成功消息
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = '分配座位失败'
    console.error('❌ 人员分配失败:', err)
  }
}

/**
 * 处理添加至备选区域
 */
const handleAddToWaiting = (person: PersonWithAssignment) => {
  error.value = null
  console.log('➕ 添加至备选区域:', person.name)
  
  try {
    // 将人员移到备选区（清除座位分配）
    const assignment: AssignmentUpdateRequest = {
      person_id: person.id,
      desk_number: null,
      seat_number: null
    }
    
    console.log('📋 创建备选区分配:', assignment)
    
    // 记录待保存的变更
    pendingChanges.value.set(person.id, assignment)
    
    // 立即更新本地状态以提供即时反馈
    updateLocalState([assignment])
    
    hasChanges.value = true
    successMessage.value = `${person.name} 已添加至备选区域（待保存）`
    console.log('✅ 添加至备选区域成功，已加入待保存队列')
    
    // 自动清除成功消息
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = '添加至备选区域失败'
    console.error('❌ 添加至备选区域失败:', err)
  }
}

/**
 * 处理备选区拖拽
 */
const handlePersonDrop = (dropData: { person: PersonWithAssignment, source: string }) => {
  error.value = null
  console.log('🎯 处理人员拖拽到备选区:', dropData.person.name, '来源:', dropData.source)
  
  try {
    // 将人员移到备选区（清除座位分配）
    const assignment: AssignmentUpdateRequest = {
      person_id: dropData.person.id,
      desk_number: null,
      seat_number: null
    }
    
    console.log('📋 创建备选区分配:', assignment)
    
    // 记录待保存的变更
    pendingChanges.value.set(dropData.person.id, assignment)
    
    // 立即更新本地状态以提供即时反馈
    updateLocalState([assignment])
    
    hasChanges.value = true
    successMessage.value = `${dropData.person.name} 已移到备选区（待保存）`
    console.log('✅ 备选区拖拽成功，已加入待保存队列')
    
    // 自动清除成功消息
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = '移动到备选区失败'
    console.error('❌ 备选区拖拽失败:', err)
  }
}

/**
 * 处理随机排座
 */
const handleRandomAssign = (persons: PersonWithAssignment[]) => {
  error.value = null
  
  try {
    // 获取所有空座位
    const emptySeats: { desk_number: number, seat_number: number }[] = []
    layout.value.forEach(desk => {
      desk.seats.forEach(seat => {
        if (!seat.person) {
          emptySeats.push({
            desk_number: seat.desk_number,
            seat_number: seat.seat_number
          })
        }
      })
    })
    
    // 检查座位是否足够
    if (emptySeats.length < persons.length) {
      throw new Error(`空座位不足！需要 ${persons.length} 个座位，但只有 ${emptySeats.length} 个空座位`)
    }
    
    // 随机打乱空座位数组
    const shuffledSeats = [...emptySeats].sort(() => Math.random() - 0.5)
    
    // 构造分配请求
    const assignments: AssignmentUpdateRequest[] = persons.map((person, index) => ({
      person_id: person.id,
      desk_number: shuffledSeats[index].desk_number,
      seat_number: shuffledSeats[index].seat_number
    }))
    
    // 记录待保存的变更
    assignments.forEach(assignment => {
      pendingChanges.value.set(assignment.person_id, assignment)
    })
    
    // 立即更新本地状态以提供即时反馈
    updateLocalState(assignments)
    
    hasChanges.value = true
    successMessage.value = `已为 ${persons.length} 人随机分配座位（待保存）`
    console.log('✅ 随机排座成功，已加入待保存队列')
    
    // 自动清除成功消息
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '随机排座失败'
    console.error('❌ 随机排座失败:', err)
  }
}

/**
 * 处理拖拽开始
 */
const handlePersonDragStart = (person: PersonWithAssignment) => {
  console.log('🚀 开始拖拽人员:', person.name)
}

// ============ 保存和系统操作 ============



// ============ 工具函数 ============

/**
 * 清除错误信息
 */
const clearError = () => {
  error.value = null
}

/**
 * 清除成功信息
 */
const clearSuccess = () => {
  successMessage.value = null
}

/**
 * 处理消息显示
 */
const handleShowMessage = (type: 'success' | 'error', message: string) => {
  if (type === 'success') {
    successMessage.value = message
    error.value = null
  } else {
    error.value = message
    successMessage.value = null
  }
}

/**
 * 格式化时间显示
 */
const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ============ 监听器 ============

// 自动清除消息
watch(successMessage, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      successMessage.value = null
    }, 5000) // 5秒后自动清除成功消息
  }
})
</script>
