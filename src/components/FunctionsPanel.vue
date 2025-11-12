<template>
  <div class="bg-card rounded-lg border border-border p-6 shadow-sm h-full">
    <!-- 标题 -->
    <div class="flex items-center space-x-2 mb-6">
      <div class="text-lg">⚙️</div>
      <h3 class="text-lg font-semibold text-card-foreground">功能操作</h3>
    </div>

    <!-- Word导出功能 -->
    <div class="space-y-3">
      <div class="text-sm font-medium text-foreground">
        📄 文档导出
      </div>
      <div class="p-4 bg-muted/30 rounded-lg border border-muted">
        <!-- 导出按钮组 - 水平排列 -->
        <div class="flex space-x-3">
          <!-- 导出学员信息按钮 -->
          <button
            @click="exportStudentInfo"
            :disabled="props.loading || exporting"
            class="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
          >
            <div v-if="exporting" class="w-3 h-3 loading-spinner"></div>
            <span>{{ exporting ? '导出中...' : '导出学员信息' }}</span>
            <div v-if="!exporting">📄</div>
          </button>
          
          <!-- 导出签到表按钮 -->
          <button
            @click="exportSignInSheet"
            :disabled="props.loading || exportingSignIn"
            class="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
          >
            <div v-if="exportingSignIn" class="w-3 h-3 loading-spinner"></div>
            <span>{{ exportingSignIn ? '导出中...' : '导出签到表' }}</span>
            <div v-if="!exportingSignIn">📋</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

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
}

const emit = defineEmits<Emits>();

// 响应式数据
const exporting = ref(false); // 导出学员信息状态
const exportingSignIn = ref(false); // 导出签到表状态

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
