// 前端入口文件 - 排座位表系统
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

console.log('🪑 启动排座位表系统前端...')

// 创建Vue应用实例
const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue应用错误:', err, info)
}

// 挂载应用
app.mount('#app')

console.log('✅ 前端应用启动完成')
