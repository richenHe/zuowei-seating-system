<template>
  <div class="bg-card rounded-lg border border-border p-6 shadow-sm h-full">
    <!-- 标题 -->
    <div class="flex items-center space-x-2 mb-6">
      <div class="text-lg">⚙️</div>
      <h3 class="text-lg font-semibold text-card-foreground">功能操作</h3>
    </div>

    <!-- 批量导入和文档导出 - 水平排列 -->
    <div class="grid grid-cols-2 gap-4">
      <!-- 批量导入功能 - 左侧 -->
      <div class="space-y-3">
        <div class="text-sm font-medium text-foreground">
          📥 批量导入
        </div>
        <div class="p-4 bg-muted/30 rounded-lg border border-muted">
          <!-- 导入按钮 -->
          <button
            @click="triggerFileInput"
            :disabled="props.loading || importing"
            class="px-3 py-1 text-xs bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
          >
            <div v-if="importing" class="w-3 h-3 loading-spinner"></div>
            <span>{{ importing ? '导入中...' : '导入Excel文件' }}</span>
            <div v-if="!importing">📥</div>
          </button>
        </div>
      </div>

      <!-- 文档导出 - 右侧 -->
      <div class="space-y-3">
        <div class="text-sm font-medium text-foreground">
          📄 文档导出
        </div>
        <div class="p-4 bg-muted/30 rounded-lg border border-muted">
          <!-- 导出按钮组 - 垂直排列 -->
          <div class="space-y-2">
            <!-- 导出学员信息按钮 -->
            <button
              @click="exportStudentInfo"
              :disabled="props.loading || exporting"
              class="w-full px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
            >
              <div v-if="exporting" class="w-3 h-3 loading-spinner"></div>
              <span>{{ exporting ? '导出中...' : '导出学员信息' }}</span>
              <div v-if="!exporting">📄</div>
            </button>
            
            <!-- 导出签到表按钮 -->
            <button
              @click="exportSignInSheet"
              :disabled="props.loading || exportingSignIn"
              class="w-full px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
            >
              <div v-if="exportingSignIn" class="w-3 h-3 loading-spinner"></div>
              <span>{{ exportingSignIn ? '导出中...' : '导出签到表' }}</span>
              <div v-if="!exportingSignIn">📋</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入结果弹窗 -->
    <div
      v-if="showImportResultModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="closeImportResultModal"
    >
      <div class="bg-card rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] border border-border shadow-lg">
        <!-- 弹窗标题 -->
        <div class="flex items-center justify-between p-6 border-b border-border">
          <h4 class="text-lg font-semibold text-red-600">⚠️ 导入失败</h4>
          <button
            @click="closeImportResultModal"
            class="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <div v-if="importResult" class="space-y-4">
            <!-- 错误提示 -->
            <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div class="text-sm font-medium text-red-800">
                {{ importResult.message }}
              </div>
            </div>

            <!-- 错误列表 -->
            <div class="space-y-2">
              <div class="text-sm font-medium text-foreground">错误详情：</div>
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div
                  v-for="(error, index) in importResult.errors"
                  :key="index"
                  class="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div class="text-sm text-red-800">
                    <span class="font-medium">{{ error.field }}：</span>
                    {{ error.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 弹窗底部按钮 -->
        <div class="flex justify-end p-6 border-t border-border">
          <button
            @click="closeImportResultModal"
            class="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import * as XLSX from 'xlsx';
import { batchImportPersons } from '@/api';
import type { PersonImportRow, PersonImportResult } from '@/types';

// 定义Props
interface Props {
  loading?: boolean; // 全局加载状态
}

// 定义Props
const props = withDefaults(defineProps<Props>(), {
  loading: false
});

// 定义Emits
interface Emits {
  (e: 'show-message', type: 'success' | 'error', message: string): void; // 显示消息提示
  (e: 'import-success'): void; // 导入成功后刷新数据
}

const emit = defineEmits<Emits>();

// 响应式数据
const exporting = ref(false); // 导出学员信息状态
const exportingSignIn = ref(false); // 导出签到表状态
const importing = ref(false); // 导入状态
const showImportResultModal = ref(false); // 导入结果弹窗显示状态
const importResult = ref<PersonImportResult | null>(null); // 导入结果

// 导出学员信息到Word文档
const exportStudentInfo = async () => {
  try {
    exporting.value = true;
    
    // 调用后端API导出Word文档
    const response = await fetch('/api/export/desk-students-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '导出失败');
    }
    
    // 获取文件blob
    const blob = await response.blob();
    
    // 从响应头获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = '学员座位信息.docx';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
      if (match) {
        filename = decodeURIComponent(match[1]);
      }
    }
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    emit('show-message', 'success', 'Word文档导出成功！');
    
  } catch (error) {
    console.error('导出Word文档失败:', error);
    const errorMessage = error instanceof Error ? error.message : '导出失败，请重试';
    emit('show-message', 'error', errorMessage);
  } finally {
    exporting.value = false;
  }
};

// 导出签到表到Word文档
const exportSignInSheet = async () => {
  try {
    exportingSignIn.value = true;
    
    // 调用后端API导出签到表Word文档
    const response = await fetch('/api/export/sign-in-sheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '导出失败');
    }
    
    // 获取文件blob
    const blob = await response.blob();
    
    // 从响应头获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = '签到表.docx';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
      if (match) {
        filename = decodeURIComponent(match[1]);
      }
    }
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    emit('show-message', 'success', '签到表导出成功！');
    
  } catch (error) {
    console.error('导出签到表失败:', error);
    const errorMessage = error instanceof Error ? error.message : '导出失败，请重试';
    emit('show-message', 'error', errorMessage);
  } finally {
    exportingSignIn.value = false;
  }
};

// 触发文件选择
const triggerFileInput = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };
  input.click();
};

// 处理导入文件
const handleImportFile = async (file: File) => {
  try {
    importing.value = true;
    
    // 验证文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      emit('show-message', 'error', '请选择Excel文件（.xlsx或.xls格式）');
      return;
    }
    
    // 验证文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      emit('show-message', 'error', '文件大小不能超过10MB');
      return;
    }
    
    // 读取文件
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    
    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      emit('show-message', 'error', 'Excel文件中没有找到工作表');
      return;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // 将工作表转换为JSON
    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
    
    if (jsonData.length === 0) {
      emit('show-message', 'error', 'Excel文件中没有数据');
      return;
    }
    
    // 验证必需的列是否存在
    const firstRow = jsonData[0];
    const requiredColumns = ['姓名', '职务', '传播大使'];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      emit('show-message', 'error', `Excel文件缺少必需的列：${missingColumns.join('、')}`);
      return;
    }
    
    // 转换数据格式
    const importData: PersonImportRow[] = jsonData.map((row: any) => {
      // 辅助函数：处理Excel单元格的值
      const getCellValue = (value: any): string => {
        if (value === null || value === undefined) return '';
        return String(value).trim();
      };
      
      return {
        name: getCellValue(row['姓名']),
        position: getCellValue(row['职务']),
        tel: getCellValue(row['电话']),
        background: getCellValue(row['背景']),
        ambassador_name: getCellValue(row['传播大使']),
        info: getCellValue(row['其他信息'])
      };
    });
    
    console.log('📤 准备发送的导入数据：', importData);
    
    // 调用批量导入API
    const result = await batchImportPersons(importData);
    
    console.log('📥 导入结果：', result);
    
    // 判断是否有错误
    if (result.errors && result.errors.length > 0) {
      // 有错误：显示详情弹窗
      importResult.value = result;
      showImportResultModal.value = true;
    } else {
      // 无错误：显示成功提示浮窗
      const successMsg = `导入成功：成功 ${result.success} 条${result.skipped > 0 ? `，跳过重复 ${result.skipped} 条` : ''}`;
      emit('show-message', 'success', successMsg);
      
      // 刷新人员列表
      if (result.success > 0) {
        emit('import-success');
      }
    }
    
  } catch (error) {
    console.error('❌ 导入文件失败:', error);
    const errorMessage = error instanceof Error ? error.message : '导入失败，请重试';
    emit('show-message', 'error', errorMessage);
  } finally {
    importing.value = false;
  }
};

// 关闭导入结果弹窗
const closeImportResultModal = () => {
  showImportResultModal.value = false;
  importResult.value = null;
};
</script>

<style scoped>
/* 加载动画 */
.loading-spinner {
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
