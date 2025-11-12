<template>
  <div class="bg-card rounded-lg border border-border p-6 shadow-sm">
    <!-- 标题 -->
    <div class="flex items-center space-x-2 mb-6">
      <div class="text-lg">👥</div>
      <h3 class="text-lg font-semibold text-card-foreground">人员管理</h3>
    </div>

    <!-- 左右两栏布局 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- 左侧：添加人员按钮 + 人员列表 -->
      <div class="space-y-6">
        <!-- 添加人员按钮区域 -->
        <div class="space-y-4">
          <div class="text-sm font-medium text-foreground mb-3">
            ➕ 添加新人员
          </div>
          <div class="p-4 bg-muted/30 rounded-lg border border-muted">
            <button
              @click="showAddPersonModal = true"
              :disabled="loading"
              class="w-full px-4 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>添加新人员</span>
              <div>➕</div>
            </button>
            <div class="text-xs text-muted-foreground mt-2 text-center">
              点击打开详细添加表单
            </div>
          </div>
        </div>

        <!-- 人员列表区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground">
              📋 人员列表（{{ persons.length }} 人）
            </div>
            <button
              @click="showPersonListModal = true"
              class="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              🔍 查看全部
            </button>
          </div>

          <!-- 紧凑人员列表 -->
          <div class="bg-muted/20 rounded-lg border border-muted p-3">
            <div v-if="persons.length === 0" class="text-center py-6">
              <div class="text-2xl mb-2">👤</div>
              <div class="text-xs text-muted-foreground">暂无人员</div>
            </div>
            
            <div v-else class="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              <div
                v-for="person in persons.slice(0, 4)"
                :key="person.id"
                class="flex items-center justify-between p-2 bg-background rounded border hover:shadow-sm transition-shadow"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <div class="text-sm font-medium truncate">{{ person.name }}</div>
                    <div
                      v-if="person.ambassador_name"
                      class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {{ person.ambassador_name }}
                    </div>
                    <div
                      v-else
                      class="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      无大使
                    </div>
                  </div>
                  <div v-if="person.info" class="text-xs text-muted-foreground mt-1 truncate">
                    {{ person.info }}
                  </div>
                </div>
                
                <div class="flex space-x-1">
                  <button
                    @click="startEdit(person)"
                    :disabled="loading"
                    class="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    @click="handleDeletePerson(person)"
                    :disabled="loading"
                    class="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <!-- 显示更多提示 -->
              <div v-if="persons.length > 4" class="text-center pt-2 border-t border-border">
                <div class="text-xs text-muted-foreground">
                  还有 {{ persons.length - 4 }} 人，点击"查看全部"查看更多
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：传播大使列表 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-foreground">
            📢 传播大使（{{ ambassadors.length }} 人）
          </div>
          <button
            @click="showAmbassadorListModal = true"
            class="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            🔍 查看全部
          </button>
        </div>
        
        <!-- 添加传播大使表单 -->
        <div class="bg-muted/20 rounded-lg border border-muted p-3 mb-3">
          <form @submit.prevent="handleAddAmbassador" class="space-y-3">
            <div class="space-y-2">
              <input
                v-model="ambassadorFormData.name"
                type="text"
                maxlength="100"
                :disabled="loading"
                class="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="输入传播大使姓名"
                required
              />
              <div v-if="ambassadorErrors.name" class="text-xs text-destructive">
                {{ ambassadorErrors.name }}
              </div>
            </div>
            <button
              type="submit"
              :disabled="loading || !isAmbassadorFormValid"
              class="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <div class="flex items-center justify-center space-x-2">
                <div v-if="loading" class="w-3 h-3 loading-spinner"></div>
                <span>{{ loading ? '添加中...' : '添加大使' }}</span>
                <div v-if="!loading">📢</div>
              </div>
            </button>
          </form>
        </div>

        <!-- 紧凑传播大使列表 -->
        <div class="bg-muted/20 rounded-lg border border-muted p-3">
          <div v-if="ambassadors.length === 0" class="text-center py-6">
            <div class="text-2xl mb-2">📢</div>
            <div class="text-xs text-muted-foreground">暂无传播大使</div>
          </div>
          
          <div v-else class="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            <div
              v-for="ambassador in ambassadors.slice(0, 4)"
              :key="ambassador.id"
              class="bg-background rounded border hover:shadow-sm transition-shadow"
            >
              <!-- 大使信息行 -->
              <div class="flex items-center justify-between p-2">
                <div class="flex items-center flex-1 min-w-0">
                  <button
                    @click="toggleAmbassadorStudents(ambassador.id)"
                    class="mr-2 p-1 hover:bg-muted rounded transition-colors"
                    :title="isAmbassadorExpanded(ambassador.id) ? '收起学员' : '展开学员'"
                  >
                    <span v-if="getAmbassadorStudents[ambassador.id].length > 0" class="text-xs">
                      {{ isAmbassadorExpanded(ambassador.id) ? '▼' : '▶' }}
                    </span>
                    <span v-else class="text-xs text-muted-foreground">○</span>
                  </button>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ ambassador.name }}</div>
                    <div class="text-xs text-muted-foreground">
                      传播大使 ({{ getAmbassadorStudents[ambassador.id].length }} 个学员)
                    </div>
                  </div>
                </div>
                
                <div class="flex space-x-1">
                  <button
                    @click="startEditAmbassador(ambassador)"
                    :disabled="loading"
                    class="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    @click="handleDeleteAmbassador(ambassador)"
                    :disabled="loading"
                    class="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <!-- 学员列表（可展开） -->
              <div 
                v-if="isAmbassadorExpanded(ambassador.id) && getAmbassadorStudents[ambassador.id].length > 0"
                class="border-t border-border bg-muted/30"
              >
                <div class="p-2 space-y-1">
                  <div class="text-xs text-muted-foreground mb-1">学员列表：</div>
                  <div
                    v-for="student in getAmbassadorStudents[ambassador.id]"
                    :key="student.id"
                    class="bg-background rounded px-2 py-1"
                  >
                    <div class="flex items-center text-xs">
                      <span class="font-medium">{{ student.name }}</span>
                    </div>
                    <div v-if="student.info" class="text-xs text-muted-foreground mt-0.5">
                      {{ student.info }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 无学员提示 -->
              <div 
                v-else-if="isAmbassadorExpanded(ambassador.id) && getAmbassadorStudents[ambassador.id].length === 0"
                class="border-t border-border bg-muted/30 p-2"
              >
                <div class="text-xs text-muted-foreground text-center">暂无学员</div>
              </div>
            </div>
            
            <!-- 显示更多提示 -->
            <div v-if="ambassadors.length > 4" class="text-center pt-2 border-t border-border">
              <div class="text-xs text-muted-foreground">
                还有 {{ ambassadors.length - 4 }} 人，点击"查看全部"查看更多
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加人员详细弹窗 -->
    <div
      v-if="showAddPersonModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAddPersonModal = false"
    >
      <div class="bg-card rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] border border-border shadow-lg">
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h4 class="text-lg font-semibold text-card-foreground">添加新人员</h4>
          <button
            @click="showAddPersonModal = false"
            class="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="p-6 overflow-y-auto max-h-[70vh]">
          <form @submit.prevent="handleAddPerson" class="space-y-6">
            <!-- 基本信息区域 -->
            <div class="space-y-4">
              <h5 class="text-md font-medium text-foreground border-b border-border pb-2">📝 基本信息</h5>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- 姓名 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-foreground">
                    姓名 <span class="text-destructive">*</span>
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    maxlength="100"
                    :disabled="loading"
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                    placeholder=""
                    required
                  />
                  <div v-if="errors.name" class="text-xs text-destructive">
                    {{ errors.name }}
                  </div>
                </div>

                <!-- 职务 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-foreground">
                    职务 <span class="text-destructive">*</span>
                  </label>
                  <select
                    v-model="formData.position"
                    :disabled="loading"
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                    required
                  >
                    <option :value="undefined">请选择职务</option>
                    <option
                      v-for="option in positionOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div v-if="errors.position" class="text-xs text-destructive">
                    {{ errors.position }}
                  </div>
                </div>
              </div>

              <!-- 联系信息 -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- 电话 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-foreground">
                    电话
                  </label>
                  <input
                    v-model="formData.tel"
                    type="tel"
                    maxlength="30"
                    :disabled="loading"
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                    placeholder=""
                  />
                  <div v-if="errors.tel" class="text-xs text-destructive">
                    {{ errors.tel }}
                  </div>
                </div>

                <!-- 背景 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-foreground">
                    背景
                  </label>
                  <input
                    v-model="formData.background"
                    type="text"
                    maxlength="255"
                    :disabled="loading"
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                    placeholder=""
                  />
                  <div v-if="errors.background" class="text-xs text-destructive">
                    {{ errors.background }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 关联信息区域 -->
            <div class="space-y-4">
              <h5 class="text-md font-medium text-foreground border-b border-border pb-2">🔗 关联信息</h5>
              
              <!-- 传播大使选择 -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-foreground">
                  传播大使
                </label>
                <input
                  :value="selectedAmbassadorName || ''"
                  type="text"
                  readonly
                  :disabled="loading"
                  class="w-full px-3 py-2 border border-input rounded-md bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 cursor-pointer"
                  placeholder=""
                  @click="showAmbassadorSelectModal = true"
                />
                <div v-if="errors.ambassador_id" class="text-xs text-destructive">
                  {{ errors.ambassador_id }}
                </div>
              </div>
            </div>

            <!-- 其他信息区域 -->
            <div class="space-y-4">
              <h5 class="text-md font-medium text-foreground border-b border-border pb-2">📄 其他信息</h5>
              
              <!-- 备注信息 -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-foreground">
                  其他信息
                </label>
                <textarea
                  v-model="formData.info"
                  rows="4"
                  maxlength="500"
                  :disabled="loading"
                  class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 resize-none"
                  placeholder=""
                ></textarea>
                <div class="text-xs text-muted-foreground text-right">
                  {{ (formData.info || '').length }}/500
                </div>
                <div v-if="errors.info" class="text-xs text-destructive">
                  {{ errors.info }}
                </div>
              </div>
            </div>

            <!-- 按钮区域 -->
            <div class="flex space-x-3 pt-6 border-t border-border">
              <button
                type="button"
                @click="showAddPersonModal = false"
                :disabled="loading"
                class="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="loading || !isFormValid"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div class="flex items-center justify-center space-x-2">
                  <div v-if="loading" class="w-4 h-4 loading-spinner"></div>
                  <span>{{ loading ? '添加中...' : '添加人员' }}</span>
                  <div v-if="!loading">➕</div>
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 人员列表弹窗 -->
    <div
      v-if="showPersonListModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showPersonListModal = false"
    >
      <div class="bg-card rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] border border-border shadow-lg">
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h4 class="text-lg font-semibold text-card-foreground">人员列表（{{ persons.length }} 人）</h4>
          <button
            @click="showPersonListModal = false"
            class="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <!-- 搜索和批量操作区域 -->
          <div class="mb-4 space-y-3">
            <!-- 搜索框 -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                  placeholder="搜索人员姓名或传播大使..."
                class="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                🔍
              </div>
            </div>
            
            <!-- 批量操作栏 -->
            <div v-if="selectedPersonIds.size > 0" class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div class="text-sm text-blue-800">
                已选中 {{ selectedPersonIds.size }} 人
              </div>
              <div class="flex space-x-2">
                <button
                  @click="clearSelection"
                  class="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  取消选择
                </button>
                <button
                  @click="handleBatchDelete"
                  :disabled="loading"
                  class="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  批量删除
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="filteredPersons.length === 0" class="text-center py-12">
            <div class="text-4xl mb-4">👤</div>
            <div class="text-muted-foreground">
              {{ searchQuery ? '未找到匹配的人员' : '暂无人员数据' }}
            </div>
          </div>
          
          <div v-else class="space-y-3">
            <!-- 全选/取消全选 -->
            <div class="flex items-center justify-between py-2 border-b border-border">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span class="text-sm text-muted-foreground">
                  {{ isAllSelected ? '取消全选' : '全选' }} ({{ filteredPersons.length }} 人)
                </span>
              </label>
            </div>
            
            <div
              v-for="person in filteredPersons"
              :key="person.id"
              class="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:shadow-md transition-shadow"
              :class="{ 'bg-blue-50 border-blue-200': selectedPersonIds.has(person.id) }"
            >
              <!-- 复选框和人员信息 -->
              <div class="flex items-start space-x-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  :checked="selectedPersonIds.has(person.id)"
                  @change="togglePersonSelection(person.id)"
                  class="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-3">
                  <div class="font-medium text-foreground">{{ person.name }}</div>
                  <div
                    v-if="person.ambassador_name"
                    class="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
                  >
                    {{ person.ambassador_name }}
                  </div>
                  <div
                    v-else
                    class="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full border border-gray-200"
                  >
                    无大使
                  </div>
                </div>
                
                <div v-if="person.info" class="text-sm text-muted-foreground mt-1">
                  备注：{{ person.info }}
                </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex items-center space-x-2">
                <button
                  @click="startEdit(person)"
                  :disabled="loading"
                  class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                  title="编辑人员信息"
                >
                  ✏️
                </button>
                <button
                  @click="handleDeletePerson(person)"
                  :disabled="loading"
                  class="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                  title="删除人员"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <!-- 弹窗内分页器 -->
            <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 border-t border-border">
              <div class="text-sm text-muted-foreground">
                第 {{ currentPage }} / {{ totalPages }} 页，共 {{ persons.length }} 人
              </div>
              <div class="flex items-center space-x-3">
                <button
                  @click="goToPage(currentPage - 1)"
                  :disabled="currentPage <= 1 || loading"
                  class="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <span class="text-sm text-muted-foreground">{{ currentPage }}</span>
                <button
                  @click="goToPage(currentPage + 1)"
                  :disabled="currentPage >= totalPages || loading"
                  class="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑模态框 -->
    <div
      v-if="editingPerson"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="cancelEdit"
    >
      <div class="bg-card rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] border border-border shadow-lg">
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h4 class="text-lg font-semibold text-card-foreground">编辑人员信息</h4>
          <button
            @click="cancelEdit"
            class="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="p-6 overflow-y-auto max-h-[70vh]">
          <form @submit.prevent="handleUpdatePerson" class="space-y-6">
            <!-- 基本信息区域 -->
            <div class="space-y-4">
              <h5 class="text-md font-medium text-foreground border-b border-border pb-2">📝 基本信息</h5>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- 姓名 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-foreground">
                    姓名 <span class="text-destructive">*</span>
                  </label>
                  <input
                    v-model="editForm.name"
                    type="text"
                    maxlength="100"
                    :disabled="loading"
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                    placeholder=""
                    required
                  />
                  <div v-if="editErrors.name" class="text-xs text-destructive">
                    {{ editErrors.name }}
                  </div>
                </div>

                <!-- 职务 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-foreground">
                    职务 <span class="text-destructive">*</span>
                  </label>
                  <select
                    v-model="editForm.position"
                    :disabled="loading"
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                    required
                  >
                    <option :value="undefined">请选择职务</option>
                    <option
                      v-for="option in positionOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <div v-if="editErrors.position" class="text-xs text-destructive">
                    {{ editErrors.position }}
                  </div>
                </div>
              </div>

              <!-- 联系信息 -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- 电话 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-foreground">
                    电话
                  </label>
                  <input
                    v-model="editForm.tel"
                    type="tel"
                    maxlength="30"
                    :disabled="loading"
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                    placeholder=""
                  />
                  <div v-if="editErrors.tel" class="text-xs text-destructive">
                    {{ editErrors.tel }}
                  </div>
                </div>

                <!-- 背景 -->
                <div class="space-y-2">
                  <label class="block text-sm font-medium text-foreground">
                    背景
                  </label>
                  <input
                    v-model="editForm.background"
                    type="text"
                    maxlength="255"
                    :disabled="loading"
                    class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
                    placeholder=""
                  />
                  <div v-if="editErrors.background" class="text-xs text-destructive">
                    {{ editErrors.background }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 关联信息区域 -->
            <div class="space-y-4">
              <h5 class="text-md font-medium text-foreground border-b border-border pb-2">🔗 关联信息</h5>
              
              <!-- 传播大使选择 -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-foreground">
                  传播大使
                </label>
                <input
                  :value="editSelectedAmbassadorName || ''"
                  type="text"
                  readonly
                  :disabled="loading"
                  class="w-full px-3 py-2 border border-input rounded-md bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 cursor-pointer"
                  placeholder=""
                  @click="showEditAmbassadorSelectModal = true"
                />
                <div v-if="editErrors.ambassador_id" class="text-xs text-destructive">
                  {{ editErrors.ambassador_id }}
                </div>
              </div>
            </div>

            <!-- 其他信息区域 -->
            <div class="space-y-4">
              <h5 class="text-md font-medium text-foreground border-b border-border pb-2">📄 其他信息</h5>
              
              <!-- 备注信息 -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-foreground">
                  其他信息
                </label>
                <textarea
                  v-model="editForm.info"
                  rows="4"
                  maxlength="500"
                  :disabled="loading"
                  class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 resize-none"
                  placeholder=""
                ></textarea>
                <div class="text-xs text-muted-foreground text-right">
                  {{ (editForm.info || '').length }}/500
                </div>
                <div v-if="editErrors.info" class="text-xs text-destructive">
                  {{ editErrors.info }}
                </div>
              </div>
            </div>

            <!-- 按钮区域 -->
            <div class="flex space-x-3 pt-6 border-t border-border">
              <button
                type="button"
                @click="cancelEdit"
                :disabled="loading"
                class="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="loading || !isEditFormValid"
                class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div class="flex items-center justify-center space-x-2">
                  <div v-if="loading" class="w-4 h-4 loading-spinner"></div>
                  <span>{{ loading ? '保存中...' : '保存人员' }}</span>
                  <div v-if="!loading">💾</div>
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 传播大使列表弹窗 -->
    <div
      v-if="showAmbassadorListModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAmbassadorListModal = false"
    >
      <div class="bg-card rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] border border-border shadow-lg">
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h4 class="text-lg font-semibold text-card-foreground">传播大使列表（{{ ambassadors.length }} 人）</h4>
          <button
            @click="showAmbassadorListModal = false"
            class="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <!-- 搜索和批量操作区域 -->
          <div class="mb-4 space-y-3">
            <!-- 搜索框 -->
            <div class="relative">
              <input
                v-model="ambassadorSearchQuery"
                type="text"
                placeholder="搜索传播大使姓名..."
                class="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                🔍
              </div>
            </div>
            
            <!-- 批量操作栏 -->
            <div v-if="selectedAmbassadorIds.size > 0" class="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div class="text-sm text-blue-800">
                已选中 {{ selectedAmbassadorIds.size }} 位传播大使
              </div>
              <div class="flex space-x-2">
                <button
                  @click="clearAmbassadorSelection"
                  class="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  取消选择
                </button>
                <button
                  @click="handleBatchDeleteAmbassadors"
                  :disabled="loading"
                  class="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  批量删除
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="filteredAmbassadors.length === 0" class="text-center py-12">
            <div class="text-4xl mb-4">📢</div>
            <div class="text-muted-foreground">
              {{ ambassadorSearchQuery ? '未找到匹配的传播大使' : '暂无传播大使数据' }}
            </div>
          </div>
          
          <div v-else class="space-y-3">
            <!-- 全选/取消全选 -->
            <div class="flex items-center justify-between py-2 border-b border-border">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  :checked="isAllAmbassadorsSelected"
                  @change="toggleSelectAllAmbassadors"
                  class="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span class="text-sm text-muted-foreground">
                  {{ isAllAmbassadorsSelected ? '取消全选' : '全选' }} ({{ filteredAmbassadors.length }} 位大使)
                </span>
              </label>
            </div>
            <div
              v-for="ambassador in paginatedAmbassadors"
              :key="ambassador.id"
              class="bg-background border border-border rounded-lg hover:shadow-md transition-shadow"
              :class="{ 'bg-blue-50 border-blue-200': selectedAmbassadorIds.has(ambassador.id) }"
            >
              <!-- 大使信息行 -->
              <div class="flex items-center justify-between p-4">
                <!-- 复选框和传播大使信息 -->
                <div class="flex items-start space-x-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    :checked="selectedAmbassadorIds.has(ambassador.id)"
                    @change="toggleAmbassadorSelection(ambassador.id)"
                    class="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <button
                    @click="toggleAmbassadorStudents(ambassador.id)"
                    class="mt-1 p-1 hover:bg-muted rounded transition-colors"
                    :title="isAmbassadorExpanded(ambassador.id) ? '收起学员' : '展开学员'"
                  >
                    <span v-if="getAmbassadorStudents[ambassador.id].length > 0" class="text-xs">
                      {{ isAmbassadorExpanded(ambassador.id) ? '▼' : '▶' }}
                    </span>
                    <span v-else class="text-xs text-muted-foreground">○</span>
                  </button>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-3">
                      <div class="font-medium text-foreground">{{ ambassador.name }}</div>
                      <div class="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200">
                        传播大使
                      </div>
                    </div>
                    <div class="text-sm text-muted-foreground mt-1">
                      创建时间：{{ new Date(ambassador.created_at).toLocaleString('zh-CN') }} | {{ getAmbassadorStudents[ambassador.id].length }} 个学员
                    </div>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="flex items-center space-x-2">
                  <button
                    @click="startEditAmbassador(ambassador)"
                    :disabled="loading"
                    class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                    title="编辑传播大使信息"
                  >
                    ✏️
                  </button>
                  <button
                    @click="handleDeleteAmbassador(ambassador)"
                    :disabled="loading"
                    class="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                    title="删除传播大使"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <!-- 学员列表（可展开） -->
              <div 
                v-if="isAmbassadorExpanded(ambassador.id) && getAmbassadorStudents[ambassador.id].length > 0"
                class="border-t border-border bg-muted/20"
              >
                <div class="p-4 space-y-2">
                  <div class="text-sm font-medium text-muted-foreground mb-2">学员列表 ({{ getAmbassadorStudents[ambassador.id].length }} 人)：</div>
                  <div class="grid grid-cols-1 gap-2">
                    <div
                      v-for="student in getAmbassadorStudents[ambassador.id]"
                      :key="student.id"
                      class="text-sm bg-background rounded border px-3 py-2"
                    >
                      <div class="flex items-center">
                        <span class="font-medium">{{ student.name }}</span>
                      </div>
                      <div v-if="student.info" class="text-xs text-muted-foreground mt-1">
                        {{ student.info }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 无学员提示 -->
              <div 
                v-else-if="isAmbassadorExpanded(ambassador.id) && getAmbassadorStudents[ambassador.id].length === 0"
                class="border-t border-border bg-muted/20 p-4"
              >
                <div class="text-sm text-muted-foreground text-center">该大使暂无学员</div>
              </div>
            </div>
            
            <!-- 传播大使分页控件 -->
            <div v-if="ambassadorTotalPages > 1" class="flex items-center justify-between pt-4 border-t border-border">
              <div class="text-sm text-muted-foreground">
                第 {{ ambassadorCurrentPage }} / {{ ambassadorTotalPages }} 页，共 {{ filteredAmbassadors.length }} 位大使
              </div>
              <div class="flex items-center space-x-3">
                <button
                  @click="goToAmbassadorPage(ambassadorCurrentPage - 1)"
                  :disabled="ambassadorCurrentPage <= 1 || loading"
                  class="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <span class="text-sm text-muted-foreground">{{ ambassadorCurrentPage }}</span>
                <button
                  @click="goToAmbassadorPage(ambassadorCurrentPage + 1)"
                  :disabled="ambassadorCurrentPage >= ambassadorTotalPages || loading"
                  class="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 传播大使编辑模态框 -->
    <div
      v-if="editingAmbassador"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="cancelEditAmbassador"
    >
      <div class="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-border shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold text-card-foreground">编辑传播大使信息</h4>
          <button
            @click="cancelEditAmbassador"
            class="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        
        <form @submit.prevent="handleUpdateAmbassador" class="space-y-4">
          <!-- 姓名 -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-foreground">
              姓名 <span class="text-destructive">*</span>
            </label>
            <input
              v-model="editAmbassadorForm.name"
              type="text"
              maxlength="100"
              :disabled="loading"
              class="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
              placeholder="请输入传播大使姓名"
              required
            />
          </div>

          <!-- 按钮组 -->
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="cancelEditAmbassador"
              :disabled="loading"
              class="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="loading || !editAmbassadorForm.name?.trim()"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ loading ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 传播大使选择弹窗 -->
    <div
      v-if="showAmbassadorSelectModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAmbassadorSelectModal = false"
    >
      <div class="bg-card rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] border border-border shadow-lg">
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h4 class="text-lg font-semibold text-card-foreground">选择传播大使</h4>
          <button
            @click="showAmbassadorSelectModal = false"
            class="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <!-- 搜索框 -->
          <div class="mb-4">
            <div class="relative">
              <input
                v-model="ambassadorSelectSearchQuery"
                type="text"
                placeholder="搜索传播大使姓名..."
                class="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                🔍
              </div>
            </div>
          </div>
          
          <div v-if="filteredAmbassadorsForSelect.length === 0" class="text-center py-12">
            <div class="text-4xl mb-4">📢</div>
            <div class="text-muted-foreground">
              {{ ambassadorSelectSearchQuery ? '未找到匹配的传播大使' : '暂无传播大使可选择' }}
            </div>
          </div>
          
          <div v-else class="space-y-3">
            <!-- 清除选择选项 -->
            <div
              @click="selectAmbassador(null); showAmbassadorSelectModal = false"
              class="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              :class="{ 'bg-blue-50 border-blue-200': !formData.ambassador_id }"
            >
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                  <div v-if="!formData.ambassador_id" class="w-3 h-3 bg-primary rounded-full"></div>
                </div>
                <div>
                  <div class="font-medium text-foreground">不选择传播大使</div>
                  <div class="text-sm text-muted-foreground">该人员不关联任何传播大使或者自己本身就是传播大使</div>
                </div>
              </div>
            </div>
            
            <!-- 传播大使选项 -->
            <div
              v-for="ambassador in filteredAmbassadorsForSelect"
              :key="ambassador.id"
              @click="selectAmbassador(ambassador); showAmbassadorSelectModal = false"
              class="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              :class="{ 'bg-blue-50 border-blue-200': formData.ambassador_id === ambassador.id }"
            >
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                  <div v-if="formData.ambassador_id === ambassador.id" class="w-3 h-3 bg-primary rounded-full"></div>
                </div>
                <div>
                  <div class="font-medium text-foreground">{{ ambassador.name }}</div>
                  <div class="text-sm text-muted-foreground">
                    创建时间：{{ new Date(ambassador.created_at).toLocaleString('zh-CN') }}
                  </div>
                </div>
              </div>
              <div class="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200">
                传播大使
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑时传播大使选择弹窗 -->
    <div
      v-if="showEditAmbassadorSelectModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showEditAmbassadorSelectModal = false"
    >
      <div class="bg-card rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] border border-border shadow-lg">
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h4 class="text-lg font-semibold text-card-foreground">选择传播大使</h4>
          <button
            @click="showEditAmbassadorSelectModal = false"
            class="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <!-- 搜索框 -->
          <div class="mb-4">
            <div class="relative">
              <input
                v-model="ambassadorSelectSearchQuery"
                type="text"
                placeholder="搜索传播大使姓名..."
                class="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                🔍
              </div>
            </div>
          </div>
          
          <div v-if="filteredAmbassadorsForSelect.length === 0" class="text-center py-12">
            <div class="text-4xl mb-4">📢</div>
            <div class="text-muted-foreground">
              {{ ambassadorSelectSearchQuery ? '未找到匹配的传播大使' : '暂无传播大使可选择' }}
            </div>
          </div>
          
          <div v-else class="space-y-3">
            <!-- 清除选择选项 -->
            <div
              @click="selectEditAmbassador(null); showEditAmbassadorSelectModal = false"
              class="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              :class="{ 'bg-blue-50 border-blue-200': !editForm.ambassador_id }"
            >
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                  <div v-if="!editForm.ambassador_id" class="w-3 h-3 bg-primary rounded-full"></div>
                </div>
                <div>
                  <div class="font-medium text-foreground">不选择传播大使</div>
                  <div class="text-sm text-muted-foreground">该人员不关联任何传播大使或者自己本身就是传播大使</div>
                </div>
              </div>
            </div>
            
            <!-- 传播大使选项 -->
            <div
              v-for="ambassador in filteredAmbassadorsForSelect"
              :key="ambassador.id"
              @click="selectEditAmbassador(ambassador); showEditAmbassadorSelectModal = false"
              class="flex items-center justify-between p-4 bg-background border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              :class="{ 'bg-blue-50 border-blue-200': editForm.ambassador_id === ambassador.id }"
            >
              <div class="flex items-center space-x-3">
                <div class="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                  <div v-if="editForm.ambassador_id === ambassador.id" class="w-3 h-3 bg-primary rounded-full"></div>
                </div>
                <div>
                  <div class="font-medium text-foreground">{{ ambassador.name }}</div>
                  <div class="text-sm text-muted-foreground">
                    创建时间：{{ new Date(ambassador.created_at).toLocaleString('zh-CN') }}
                  </div>
                </div>
              </div>
              <div class="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200">
                传播大使
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { PersonWithAssignment, PersonCreateRequest, PersonUpdateRequest, Ambassador, AmbassadorCreateRequest, AmbassadorUpdateRequest } from '@/types'

// ============ Props ============
interface Props {
  persons: PersonWithAssignment[]
  ambassadors: Ambassador[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// ============ Emits ============
interface Emits {
  (e: 'add-person', person: PersonCreateRequest): void
  (e: 'update-person', id: number, person: PersonUpdateRequest): void
  (e: 'delete-person', id: number): void
  (e: 'batch-delete-persons', person_ids: number[]): void
  (e: 'add-ambassador', ambassador: AmbassadorCreateRequest): void
  (e: 'update-ambassador', id: number, ambassador: AmbassadorUpdateRequest): void
  (e: 'delete-ambassador', id: number): void
  (e: 'batch-delete-ambassadors', ambassador_ids: number[]): void
}

const emit = defineEmits<Emits>()

// ============ 响应式状态 ============

// 添加人员表单
const formData = reactive<PersonCreateRequest>({
  name: '',
  ambassador_id: undefined,
  position: undefined,
  tel: '',
  background: '',
  info: ''
})

// 编辑人员
const editingPerson = ref<PersonWithAssignment | null>(null)
const editForm = reactive<PersonUpdateRequest>({
  name: '',
  ambassador_id: undefined,
  position: undefined,
  tel: '',
  background: '',
  info: ''
})

// 添加传播大使表单
const ambassadorFormData = reactive<AmbassadorCreateRequest>({
  name: ''
})

// 编辑传播大使
const editingAmbassador = ref<Ambassador | null>(null)
const editAmbassadorForm = reactive<AmbassadorUpdateRequest>({
  name: ''
})

// ============ 分页相关 ============
const currentPage = ref(1)                      // 当前页码（人员列表）
const pageSize = 20                             // 每页显示20个
const ambassadorCurrentPage = ref(1)            // 当前页码（传播大使列表）
const ambassadorPageSize = 15                   // 传播大使每页显示15个

// ============ 弹窗状态 ============
const showAddPersonModal = ref(false)           // 添加人员弹窗显示状态
const showPersonListModal = ref(false)          // 人员列表弹窗显示状态
const showAmbassadorListModal = ref(false)      // 传播大使列表弹窗显示状态
const showAmbassadorSelectModal = ref(false)    // 传播大使选择弹窗显示状态
const showEditAmbassadorSelectModal = ref(false) // 编辑时传播大使选择弹窗显示状态

// ============ 大使展开状态 ============
const expandedAmbassadors = ref(new Set<number>()) // 展开的大使ID集合

// ============ 搜索和批量操作 ============
const searchQuery = ref('')                     // 搜索关键词
const selectedPersonIds = ref(new Set<number>())// 选中的人员ID集合
const ambassadorSearchQuery = ref('')           // 传播大使搜索关键词
const selectedAmbassadorIds = ref(new Set<number>())// 选中的传播大使ID集合
const ambassadorSelectSearchQuery = ref('')      // 传播大使选择弹窗搜索关键词

// 表单验证错误
const errors = reactive<Record<string, string>>({})
const editErrors = reactive<Record<string, string>>({})
const ambassadorErrors = reactive<Record<string, string>>({})

// ============ 计算属性 ============
const isFormValid = computed(() => {
  const trimmedName = formData.name.trim()
  
  return trimmedName.length > 0 && 
         trimmedName.length <= 100 &&
         formData.position !== undefined && // 职务必填
         (!formData.tel || formData.tel.trim().length <= 30) &&
         (!formData.background || formData.background.trim().length <= 255) &&
         (!formData.info || formData.info.length <= 500)
})

// 传播大使表单验证
const isAmbassadorFormValid = computed(() => {
  return ambassadorFormData.name.trim().length > 0 && 
         ambassadorFormData.name.trim().length <= 100
})

// 选中的传播大使名称（用于显示）
const selectedAmbassadorName = computed(() => {
  if (formData.ambassador_id) {
    const ambassador = props.ambassadors.find(a => a.id === formData.ambassador_id)
    return ambassador ? ambassador.name : ''
  }
  return ''
})

// 编辑时选中的传播大使名称（用于显示）
const editSelectedAmbassadorName = computed(() => {
  if (editForm.ambassador_id) {
    const ambassador = props.ambassadors.find(a => a.id === editForm.ambassador_id)
    return ambassador ? ambassador.name : ''
  }
  return ''
})

// 编辑表单验证
const isEditFormValid = computed(() => {
  const trimmedName = editForm.name?.trim()
  
  return !!trimmedName && 
         trimmedName.length > 0 && 
         trimmedName.length <= 100 &&
         editForm.position !== undefined && // 职务必填
         (!editForm.tel || editForm.tel.trim().length <= 30) &&
         (!editForm.background || editForm.background.trim().length <= 255) &&
         (!editForm.info || editForm.info.length <= 500)
})

// 职务选项
const positionOptions = [
  { value: 1, label: '辅导员' },
  { value: 2, label: '助攻手' },
  { value: 3, label: '组长' },
  { value: 4, label: '副组长' },
  { value: 5, label: '学员' }
]

// 根据职务数字获取职务名称
const getPositionName = (position?: number) => {
  if (!position) return ''
  const option = positionOptions.find(opt => opt.value === position)
  return option ? option.label : ''
}

// 获取每个大使的学员列表
const getAmbassadorStudents = computed(() => {
  const studentsMap: Record<number, PersonWithAssignment[]> = {}
  
  props.ambassadors.forEach(ambassador => {
    studentsMap[ambassador.id] = props.persons.filter(person => 
      person.ambassador_id === ambassador.id
    )
  })
  
  return studentsMap
})

// 搜索过滤后的人员列表
const filteredPersons = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.persons
  }
  
          const query = searchQuery.value.trim().toLowerCase()
  return props.persons.filter(person => 
    person.name.toLowerCase().includes(query) ||
    (person.ambassador_name && person.ambassador_name.toLowerCase().includes(query))
  )
})

// 搜索过滤后的传播大使列表
const filteredAmbassadors = computed(() => {
  if (!ambassadorSearchQuery.value.trim()) {
    return props.ambassadors
  }
  
  const query = ambassadorSearchQuery.value.trim().toLowerCase()
  return props.ambassadors.filter(ambassador => 
    ambassador.name.toLowerCase().includes(query)
  )
})

// 全选状态
const isAllSelected = computed(() => {
  return filteredPersons.value.length > 0 && 
         filteredPersons.value.every(person => selectedPersonIds.value.has(person.id))
})

// 传播大使全选状态
const isAllAmbassadorsSelected = computed(() => {
  return filteredAmbassadors.value.length > 0 && 
         filteredAmbassadors.value.every(ambassador => selectedAmbassadorIds.value.has(ambassador.id))
})

// 传播大使选择弹窗过滤列表
const filteredAmbassadorsForSelect = computed(() => {
  if (!ambassadorSelectSearchQuery.value.trim()) {
    return props.ambassadors
  }
  
  const query = ambassadorSelectSearchQuery.value.trim().toLowerCase()
  return props.ambassadors.filter(ambassador => 
    ambassador.name.toLowerCase().includes(query)
  )
})

// 分页相关计算属性
const totalPages = computed(() => Math.ceil(filteredPersons.value.length / pageSize))

// 传播大使分页相关计算属性
const ambassadorTotalPages = computed(() => Math.ceil(filteredAmbassadors.value.length / ambassadorPageSize))

// 当前页传播大使列表（分页后的）
const paginatedAmbassadors = computed(() => {
  const startIndex = (ambassadorCurrentPage.value - 1) * ambassadorPageSize
  const endIndex = startIndex + ambassadorPageSize
  return filteredAmbassadors.value.slice(startIndex, endIndex)
})

// ============ 事件处理 ============

/**
 * 切换人员选择状态
 */
const togglePersonSelection = (personId: number) => {
  if (selectedPersonIds.value.has(personId)) {
    selectedPersonIds.value.delete(personId)
  } else {
    selectedPersonIds.value.add(personId)
  }
}

/**
 * 切换全选状态
 */
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消全选
    selectedPersonIds.value.clear()
  } else {
    // 全选当前过滤结果
    filteredPersons.value.forEach(person => {
      selectedPersonIds.value.add(person.id)
    })
  }
}

/**
 * 清除选择
 */
const clearSelection = () => {
  selectedPersonIds.value.clear()
}

/**
 * 批量删除人员
 */
const handleBatchDelete = () => {
  const selectedCount = selectedPersonIds.value.size
  if (selectedCount === 0) return
  
  const selectedNames = Array.from(selectedPersonIds.value)
    .map(id => props.persons.find(p => p.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3) // 只显示前3个名字
    .join('、')
  
  const displayNames = selectedNames + (selectedCount > 3 ? ` 等${selectedCount}人` : '')
  
  if (!confirm(`确定要删除 ${displayNames} 吗？此操作不可撤销。`)) {
    return
  }
  
  // 批量删除选中的人员
  const personIdsArray = Array.from(selectedPersonIds.value)
  emit('batch-delete-persons', personIdsArray)
  
  // 清除选择
  clearSelection()
}

/**
 * 添加人员
 */
const handleAddPerson = () => {
  // 清空错误
  Object.keys(errors).forEach(key => delete errors[key])
  
  // 验证表单
  if (!formData.name.trim()) {
    errors.name = '姓名不能为空'
    return
  }
  
  if (formData.name.trim().length > 100) {
    errors.name = '姓名长度不能超过100个字符'
    return
  }
  
  // 验证职务
  if (formData.position === undefined) {
    errors.position = '职务不能为空，请选择职务'
    return
  }
  
  // 检查姓名唯一性
  const trimmedName = formData.name.trim()
  const existingPerson = props.persons.find(p => 
    p.name.toLowerCase() === trimmedName.toLowerCase()
  )
  if (existingPerson) {
    errors.name = `姓名"${trimmedName}"已存在，请使用其他姓名`
    return
  }
  
  // 验证电话
  if (formData.tel && formData.tel.trim().length > 30) {
    errors.tel = '电话长度不能超过30个字符'
    return
  }
  
  // 验证背景
  if (formData.background && formData.background.trim().length > 255) {
    errors.background = '背景长度不能超过255个字符'
    return
  }
  
  // 验证其他信息
  if (formData.info && formData.info.length > 500) {
    errors.info = '其他信息长度不能超过500个字符'
    return
  }
  
  // 发送添加请求
  emit('add-person', {
    name: trimmedName,
    ambassador_id: formData.ambassador_id === undefined ? null : formData.ambassador_id,
    position: formData.position,
    tel: formData.tel?.trim() || '',
    background: formData.background?.trim() || '',
    info: formData.info?.trim() || ''
  })
  
  // 重置表单并关闭弹窗
  resetForm()
  showAddPersonModal.value = false
}

/**
 * 开始编辑人员
 */
const startEdit = (person: PersonWithAssignment) => {
  editingPerson.value = person
  editForm.name = person.name
  editForm.ambassador_id = person.ambassador_id ?? undefined
  editForm.position = person.position
  editForm.tel = person.tel || ''
  editForm.background = person.background || ''
  editForm.info = person.info || ''
  // 清空编辑错误
  Object.keys(editErrors).forEach(key => delete editErrors[key])
}

/**
 * 更新人员信息
 */
const handleUpdatePerson = () => {
  if (!editingPerson.value) return
  
  // 清空错误
  Object.keys(editErrors).forEach(key => delete editErrors[key])
  
  // 验证表单
  if (!editForm.name?.trim()) {
    editErrors.name = '姓名不能为空'
    return
  }
  
  if (editForm.name.trim().length > 100) {
    editErrors.name = '姓名长度不能超过100个字符'
    return
  }
  
  // 验证职务
  if (editForm.position === undefined) {
    editErrors.position = '职务不能为空，请选择职务'
    return
  }
  
  // 验证电话
  if (editForm.tel && editForm.tel.trim().length > 30) {
    editErrors.tel = '电话长度不能超过30个字符'
    return
  }
  
  // 验证背景
  if (editForm.background && editForm.background.trim().length > 255) {
    editErrors.background = '背景长度不能超过255个字符'
    return
  }
  
  // 验证其他信息
  if (editForm.info && editForm.info.length > 500) {
    editErrors.info = '其他信息长度不能超过500个字符'
    return
  }
  
  // 检查姓名唯一性（排除当前编辑的人员）
  const trimmedName = editForm.name.trim()
  const existingPerson = props.persons.find(p => 
    p.name.toLowerCase() === trimmedName.toLowerCase() && 
    p.id !== editingPerson.value!.id
  )
  if (existingPerson) {
    editErrors.name = `姓名"${trimmedName}"已存在，请使用其他姓名`
    return
  }
  
  emit('update-person', editingPerson.value.id, {
    name: trimmedName,
    ambassador_id: editForm.ambassador_id === undefined ? null : editForm.ambassador_id,
    position: editForm.position,
    tel: editForm.tel?.trim() || '',
    background: editForm.background?.trim() || '',
    info: editForm.info?.trim() || ''
  })
  
  cancelEdit()
}

/**
 * 取消编辑
 */
const cancelEdit = () => {
  editingPerson.value = null
  editForm.name = ''
  editForm.ambassador_id = undefined
  editForm.position = undefined
  editForm.tel = ''
  editForm.background = ''
  editForm.info = ''
  // 清空编辑错误
  Object.keys(editErrors).forEach(key => delete editErrors[key])
}

/**
 * 删除人员
 */
const handleDeletePerson = (person: PersonWithAssignment) => {
  emit('delete-person', person.id)
}

/**
 * 重置表单
 */
const resetForm = () => {
  formData.name = ''
  formData.ambassador_id = undefined
  formData.position = undefined
  formData.tel = ''
  formData.background = ''
  formData.info = ''
  Object.keys(errors).forEach(key => delete errors[key])
}

// ============ 传播大使事件处理 ============

/**
 * 添加传播大使
 */
const handleAddAmbassador = () => {
  // 清空错误
  Object.keys(ambassadorErrors).forEach(key => delete ambassadorErrors[key])
  
  // 验证表单
  if (!ambassadorFormData.name.trim()) {
    ambassadorErrors.name = '传播大使姓名不能为空'
    return
  }
  
  if (ambassadorFormData.name.trim().length > 100) {
    ambassadorErrors.name = '姓名长度不能超过100个字符'
    return
  }
  
  // 检查传播大使姓名唯一性
  const trimmedAmbassadorName = ambassadorFormData.name.trim()
  const existingAmbassador = props.ambassadors.find(a => 
    a.name.toLowerCase() === trimmedAmbassadorName.toLowerCase()
  )
  if (existingAmbassador) {
    ambassadorErrors.name = `传播大使姓名"${trimmedAmbassadorName}"已存在，请使用其他姓名`
    return
  }
  
  // 发送添加请求
  emit('add-ambassador', {
    name: trimmedAmbassadorName
  })
  
  // 重置表单
  resetAmbassadorForm()
}

/**
 * 开始编辑传播大使
 */
const startEditAmbassador = (ambassador: Ambassador) => {
  editingAmbassador.value = ambassador
  editAmbassadorForm.name = ambassador.name
}

/**
 * 更新传播大使信息
 */
const handleUpdateAmbassador = () => {
  if (!editingAmbassador.value || !editAmbassadorForm.name?.trim()) return
  
  const trimmedAmbassadorName = editAmbassadorForm.name.trim()
  
  // 检查传播大使姓名唯一性（排除当前编辑的传播大使）
  const existingAmbassador = props.ambassadors.find(a => 
    a.name.toLowerCase() === trimmedAmbassadorName.toLowerCase() && 
    a.id !== editingAmbassador.value!.id
  )
  if (existingAmbassador) {
    // 这里可以添加错误提示，但由于编辑传播大使模态框比较简单，我们用alert显示
    alert(`传播大使姓名"${trimmedAmbassadorName}"已存在，请使用其他姓名`)
    return
  }
  
  emit('update-ambassador', editingAmbassador.value.id, {
    name: trimmedAmbassadorName
  })
  
  cancelEditAmbassador()
}

/**
 * 取消编辑传播大使
 */
const cancelEditAmbassador = () => {
  editingAmbassador.value = null
  editAmbassadorForm.name = ''
}

/**
 * 删除传播大使
 */
const handleDeleteAmbassador = (ambassador: Ambassador) => {
  if (confirm(`确定要删除传播大使"${ambassador.name}"吗？此操作不可撤销。`)) {
    emit('delete-ambassador', ambassador.id)
  }
}

/**
 * 重置传播大使表单
 */
const resetAmbassadorForm = () => {
  ambassadorFormData.name = ''
  Object.keys(ambassadorErrors).forEach(key => delete ambassadorErrors[key])
}

// ============ 传播大使批量操作 ============

/**
 * 切换传播大使选择状态
 */
const toggleAmbassadorSelection = (ambassadorId: number) => {
  if (selectedAmbassadorIds.value.has(ambassadorId)) {
    selectedAmbassadorIds.value.delete(ambassadorId)
  } else {
    selectedAmbassadorIds.value.add(ambassadorId)
  }
}

/**
 * 切换传播大使全选状态
 */
const toggleSelectAllAmbassadors = () => {
  if (isAllAmbassadorsSelected.value) {
    // 取消全选
    selectedAmbassadorIds.value.clear()
  } else {
    // 全选当前过滤结果
    filteredAmbassadors.value.forEach(ambassador => {
      selectedAmbassadorIds.value.add(ambassador.id)
    })
  }
}

/**
 * 清除传播大使选择
 */
const clearAmbassadorSelection = () => {
  selectedAmbassadorIds.value.clear()
}

/**
 * 批量删除传播大使
 */
const handleBatchDeleteAmbassadors = () => {
  const selectedCount = selectedAmbassadorIds.value.size
  if (selectedCount === 0) return
  
  const selectedNames = Array.from(selectedAmbassadorIds.value)
    .map(id => props.ambassadors.find(a => a.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3) // 只显示前3个名字
    .join('、')
  
  const displayNames = selectedNames + (selectedCount > 3 ? ` 等${selectedCount}位大使` : '')
  
  if (!confirm(`确定要删除 ${displayNames} 吗？此操作不可撤销。`)) {
    return
  }
  
  // 批量删除选中的传播大使
  const ambassadorIdsArray = Array.from(selectedAmbassadorIds.value)
  emit('batch-delete-ambassadors', ambassadorIdsArray)
  
  // 清除选择
  clearAmbassadorSelection()
}

// ============ 传播大使选择相关方法 ============

/**
 * 选择传播大使
 */
const selectAmbassador = (ambassador: Ambassador | null) => {
  if (ambassador) {
    formData.ambassador_id = ambassador.id
  } else {
    formData.ambassador_id = undefined
  }
  // 清空搜索条件
  ambassadorSelectSearchQuery.value = ''
}



/**
 * 编辑时选择传播大使
 */
const selectEditAmbassador = (ambassador: Ambassador | null) => {
  if (ambassador) {
    editForm.ambassador_id = ambassador.id
  } else {
    editForm.ambassador_id = undefined
  }
  // 清空搜索条件
  ambassadorSelectSearchQuery.value = ''
}

// ============ 大使学员展开方法 ============
/**
 * 切换大使学员列表的展开/收起状态
 */
const toggleAmbassadorStudents = (ambassadorId: number) => {
  const expanded = expandedAmbassadors.value
  if (expanded.has(ambassadorId)) {
    expanded.delete(ambassadorId)
  } else {
    expanded.add(ambassadorId)
  }
}

/**
 * 检查大使学员列表是否已展开
 */
const isAmbassadorExpanded = (ambassadorId: number) => {
  return expandedAmbassadors.value.has(ambassadorId)
}

// ============ 分页方法 ============
/**
 * 跳转到指定页面（人员列表）
 */
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

/**
 * 跳转到指定页面（传播大使列表）
 */
const goToAmbassadorPage = (page: number) => {
  if (page < 1 || page > ambassadorTotalPages.value) return
  ambassadorCurrentPage.value = page
}

// ============ 监听器 ============

// 监听传播大使搜索，重置页码
watch(ambassadorSearchQuery, () => {
  ambassadorCurrentPage.value = 1
})

// 监听传播大使弹窗打开，重置页码
watch(showAmbassadorListModal, (newValue) => {
  if (newValue) {
    ambassadorCurrentPage.value = 1
    ambassadorSearchQuery.value = ''
  }
})
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.loading-spinner {
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>