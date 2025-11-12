<template>
  <div class="bg-card rounded-lg border border-border p-6 shadow-sm min-h-96">
    <!-- 标题 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-2">
        <div class="text-lg">🪑</div>
        <h3 class="text-lg font-semibold text-card-foreground">座位区域</h3>
      </div>
      
      <!-- 配置信息 -->
      <div v-if="config" class="text-sm text-muted-foreground">
        {{ config.desk_count }} 桌 × {{ config.seats_per_desk }} 座位
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="w-8 h-8 loading-spinner mx-auto mb-3"></div>
        <div class="text-sm text-muted-foreground">加载座位布局中...</div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!config" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="text-4xl mb-3">⚙️</div>
        <div class="text-sm text-muted-foreground">请先配置桌子数量和座位数</div>
      </div>
    </div>

    <!-- 座位布局 -->
    <div v-else class="seating-layout">
      <!-- 滚动容器 - 4列时限制显示宽度 -->
      <div 
        class="seating-scroll-container overflow-auto max-h-[70vh] border border-border rounded-lg"
        :style="scrollContainerStyle"
      >
        <!-- 座位网格 -->
        <div 
          class="justify-items-center px-8 py-6"
          :class="gapClass"
          :style="gridStyle"
        >
        <!-- 每张桌子 -->
        <div
          v-for="desk in layout"
          :key="desk.desk_number"
          class="rectangular-desk-container fade-in"
          :style="{ animationDelay: `${desk.desk_number * 0.1}s` }"
        >
          <!-- 长方形桌布 -->
          <div class="table-cloth-wrapper">
            <svg class="table-cloth-svg" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- 桌布阴影 -->
              <ellipse cx="100" cy="395" rx="85" ry="15" fill="rgba(0,0,0,0.1)"/>
              
              <!-- 桌子主体 -->
              <rect x="20" y="30" width="160" height="340" rx="15" ry="15" :fill="`url(#tableGradient-${desk.desk_number})`" :stroke="`url(#tableBorder-${desk.desk_number})`" stroke-width="2"/>
              
              <!-- 渐变定义 -->
              <defs>
                <linearGradient :id="`tableGradient-${desk.desk_number}`" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" :style="`stop-color:${lightenColor(props.tableColor, 20)};stop-opacity:1`" />
                  <stop offset="50%" :style="`stop-color:${props.tableColor};stop-opacity:1`" />
                  <stop offset="100%" :style="`stop-color:${darkenColor(props.tableColor, 20)};stop-opacity:1`" />
                </linearGradient>
                
                <linearGradient :id="`tableBorder-${desk.desk_number}`" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" :style="`stop-color:${darkenColor(props.tableColor, 30)};stop-opacity:1`" />
                  <stop offset="100%" :style="`stop-color:${darkenColor(props.tableColor, 50)};stop-opacity:1`" />
                </linearGradient>
              </defs>
              
              <!-- 桌布装饰边缘 -->
              <rect x="22" y="32" width="156" height="8" fill="rgba(255,255,255,0.3)" opacity="0.6"/>
              <rect x="22" y="360" width="156" height="8" fill="rgba(255,255,255,0.3)" opacity="0.6"/>
              
              <!-- 桌布中央装饰 -->
              <ellipse cx="100" cy="200" rx="60" ry="40" fill="rgba(255,255,255,0.1)" opacity="0.8"/>
            </svg>
            
            <!-- 桌子标签 -->
            <div class="desk-label">
              桌 {{ desk.desk_number }}
            </div>
          </div>

          <!-- 上方座位 (固定1个) -->
          <div class="top-seats">
            <div
              v-if="props.config && props.config.seats_per_desk > 0"
              :key="`${desk.desk_number}-top-0`"
              :class="getSeatSide(0)"
              class="seat-position"
              :draggable="!!getSeat(desk, 0)?.person"
              @click="handleSeatClick(getSeat(desk, 0)!, $event)"
              @dragstart="handleSeatDragStart($event, getSeat(desk, 0)!)"
              @dragend="handleSeatDragEnd"
              @dragover="handleSeatDragOver"
              @dragleave="handleSeatDragLeave"
              @drop="handleSeatDrop($event, getSeat(desk, 0)!)"
              @mouseenter="showTooltip($event, getSeat(desk, 0)!)"
              @mouseleave="hideTooltip"
            >
              <div class="seat-avatar">
                <!-- 有人的座位 -->
                <template v-if="getSeat(desk, 0)?.person">
                  <div class="avatar-container">
                    <svg class="person-avatar-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <!-- 头像背景圆形 -->
                      <circle cx="30" cy="30" r="28" fill="url(#avatarGradient)" stroke="url(#avatarBorder)" stroke-width="2"/>
                      
                      <!-- 渐变定义 -->
                      <defs>
                        <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style="stop-color:#dbeafe;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#bfdbfe;stop-opacity:1" />
                        </linearGradient>
                        
                        <linearGradient id="avatarBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      
                      <!-- 人物头像 -->
                      <g transform="translate(30, 30)">
                        <!-- 头部 -->
                        <circle cx="0" cy="-8" r="10" fill="#fbbf24" opacity="0.9"/>
                        
                        <!-- 眼睛 -->
                        <circle cx="-4" cy="-10" r="1.5" fill="#374151"/>
                        <circle cx="4" cy="-10" r="1.5" fill="#374151"/>
                        
                        <!-- 嘴巴 -->
                        <path d="M -3 -5 Q 0 -3 3 -5" stroke="#374151" stroke-width="1" fill="none" stroke-linecap="round"/>
                        
                        <!-- 身体 -->
                        <rect x="-8" y="2" width="16" height="18" rx="8" fill="#60a5fa" opacity="0.9"/>
                        
                        <!-- 领子 -->
                        <path d="M -6 2 L 0 8 L 6 2" fill="#3b82f6" opacity="0.8"/>
                        
                        <!-- 装饰细节 -->
                        <circle cx="0" cy="8" r="1" fill="rgba(255,255,255,0.6)"/>
                      </g>
                      
                      <!-- 在线状态指示器 -->
                      <circle cx="48" cy="12" r="6" fill="#10b981" opacity="0.9"/>
                      <circle cx="48" cy="12" r="3" fill="#ffffff"/>
                    </svg>
                    
                    <!-- 职务标签 -->
                    <div 
                      v-if="shouldShowPositionTag(getSeat(desk, 0)?.person?.position)"
                      class="position-tag"
                      :style="{ color: getPositionColor(getSeat(desk, 0)?.person?.position) }"
                    >
                      {{ getPositionLabel(getSeat(desk, 0)?.person?.position) }}
                    </div>
                  </div>
                  <div class="person-name">{{ getSeat(desk, 0)?.person?.name }}</div>
                </template>
                
                <!-- 空座位 -->
                <template v-else>
                  <svg class="empty-seat-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- 空座位背景圆形 -->
                    <circle cx="30" cy="30" r="28" fill="url(#emptyGradient)" stroke="url(#emptyBorder)" stroke-width="2" stroke-dasharray="4 4"/>
                    
                    <!-- 渐变定义 -->
                    <defs>
                      <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f9fafb;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
                      </linearGradient>
                      
                      <linearGradient id="emptyBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#d1d5db;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#9ca3af;stop-opacity:1" />
                      </linearGradient>
                    </defs>
                    
                    <!-- 椅子图标 -->
                    <g transform="translate(30, 30)" opacity="0.5">
                      <!-- 椅背 -->
                      <rect x="-8" y="-15" width="16" height="12" rx="2" fill="#d1d5db" stroke="#9ca3af" stroke-width="1"/>
                      
                      <!-- 座椅 -->
                      <rect x="-10" y="-3" width="20" height="8" rx="4" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>
                      
                      <!-- 椅腿 -->
                      <line x1="-8" y1="5" x2="-8" y2="12" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="5" x2="8" y2="12" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="-8" y1="-3" x2="-8" y2="-8" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="-3" x2="8" y2="-8" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                    </g>
                    
                    <!-- 加号图标表示可添加 -->
                    <g transform="translate(30, 30)" opacity="0.4">
                      <line x1="0" y1="-6" x2="0" y2="6" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
                      <line x1="-6" y1="0" x2="6" y2="0" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
                    </g>
                  </svg>
                  <div class="empty-label">空座</div>
                </template>
              </div>
            </div>
          </div>

           <!-- 左侧座位 -->
           <div class="left-seats">
             <div
               v-for="seatIndex in leftSeatsCount"
               :key="`${desk.desk_number}-left-${seatIndex}`"
              :class="getSeatSide(1 + seatIndex - 1)"
              class="seat-position"
              :draggable="!!getSeat(desk, 1 + seatIndex - 1)?.person"
              @click="handleSeatClick(getSeat(desk, 1 + seatIndex - 1)!, $event)"
              @dragstart="handleSeatDragStart($event, getSeat(desk, 1 + seatIndex - 1)!)"
              @dragend="handleSeatDragEnd"
              @dragover="handleSeatDragOver"
              @dragleave="handleSeatDragLeave"
              @drop="handleSeatDrop($event, getSeat(desk, 1 + seatIndex - 1)!)"
              @mouseenter="showTooltip($event, getSeat(desk, 1 + seatIndex - 1)!)"
            @mouseleave="hideTooltip"
          >
              <div class="seat-avatar">
            <!-- 有人的座位 -->
                <template v-if="getSeat(desk, 1 + seatIndex - 1)?.person">
                  <div class="avatar-container">
                    <svg class="person-avatar-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <!-- 头像背景圆形 -->
                      <circle cx="30" cy="30" r="28" fill="url(#avatarGradient)" stroke="url(#avatarBorder)" stroke-width="2"/>
                      
                      <!-- 渐变定义 -->
                      <defs>
                        <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style="stop-color:#dbeafe;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#bfdbfe;stop-opacity:1" />
                        </linearGradient>
                        
                        <linearGradient id="avatarBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      
                      <!-- 人物头像 -->
                      <g transform="translate(30, 30)">
                        <!-- 头部 -->
                        <circle cx="0" cy="-8" r="10" fill="#fbbf24" opacity="0.9"/>
                        
                        <!-- 眼睛 -->
                        <circle cx="-4" cy="-10" r="1.5" fill="#374151"/>
                        <circle cx="4" cy="-10" r="1.5" fill="#374151"/>
                        
                        <!-- 嘴巴 -->
                        <path d="M -3 -5 Q 0 -3 3 -5" stroke="#374151" stroke-width="1" fill="none" stroke-linecap="round"/>
                        
                        <!-- 身体 -->
                        <rect x="-8" y="2" width="16" height="18" rx="8" fill="#60a5fa" opacity="0.9"/>
                        
                        <!-- 领子 -->
                        <path d="M -6 2 L 0 8 L 6 2" fill="#3b82f6" opacity="0.8"/>
                        
                        <!-- 装饰细节 -->
                        <circle cx="0" cy="8" r="1" fill="rgba(255,255,255,0.6)"/>
                      </g>
                      
                      <!-- 在线状态指示器 -->
                      <circle cx="48" cy="12" r="6" fill="#10b981" opacity="0.9"/>
                      <circle cx="48" cy="12" r="3" fill="#ffffff"/>
                    </svg>
                    
                    <!-- 职务标签 -->
                    <div 
                      v-if="shouldShowPositionTag(getSeat(desk, 1 + seatIndex - 1)?.person?.position)"
                      class="position-tag"
                      :style="{ color: getPositionColor(getSeat(desk, 1 + seatIndex - 1)?.person?.position) }"
                    >
                      {{ getPositionLabel(getSeat(desk, 1 + seatIndex - 1)?.person?.position) }}
                    </div>
                  </div>
                  <div class="person-name">{{ getSeat(desk, 1 + seatIndex - 1)?.person?.name }}</div>
                </template>
                
                <!-- 空座位 -->
                <template v-else>
                  <svg class="empty-seat-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- 空座位背景圆形 -->
                    <circle cx="30" cy="30" r="28" fill="url(#emptyGradient)" stroke="url(#emptyBorder)" stroke-width="2" stroke-dasharray="4 4"/>
                    
                    <!-- 渐变定义 -->
                    <defs>
                      <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f9fafb;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
                      </linearGradient>
                      
                      <linearGradient id="emptyBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#d1d5db;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#9ca3af;stop-opacity:1" />
                      </linearGradient>
                    </defs>
                    
                    <!-- 椅子图标 -->
                    <g transform="translate(30, 30)" opacity="0.5">
                      <!-- 椅背 -->
                      <rect x="-8" y="-15" width="16" height="12" rx="2" fill="#d1d5db" stroke="#9ca3af" stroke-width="1"/>
                      
                      <!-- 座椅 -->
                      <rect x="-10" y="-3" width="20" height="8" rx="4" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>
                      
                      <!-- 椅腿 -->
                      <line x1="-8" y1="5" x2="-8" y2="12" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="5" x2="8" y2="12" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="-8" y1="-3" x2="-8" y2="-8" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="-3" x2="8" y2="-8" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                    </g>
                    
                    <!-- 加号图标表示可添加 -->
                    <g transform="translate(30, 30)" opacity="0.4">
                      <line x1="0" y1="-6" x2="0" y2="6" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
                      <line x1="-6" y1="0" x2="6" y2="0" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
                    </g>
                  </svg>
                  <div class="empty-label">空座</div>
                </template>
              </div>
            </div>
              </div>

          <!-- 右侧座位 -->
          <div class="right-seats">
            <div
              v-for="seatIndex in rightSeatsCount"
              :key="`${desk.desk_number}-right-${seatIndex}`"
              :class="getSeatSide(1 + leftSeatsCount + seatIndex - 1)"
              class="seat-position"
              :draggable="!!getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)?.person"
              @click="handleSeatClick(getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)!, $event)"
              @dragstart="handleSeatDragStart($event, getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)!)"
              @dragend="handleSeatDragEnd"
              @dragover="handleSeatDragOver"
              @dragleave="handleSeatDragLeave"
              @drop="handleSeatDrop($event, getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)!)"
              @mouseenter="showTooltip($event, getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)!)"
              @mouseleave="hideTooltip"
            >
              <div class="seat-avatar">
                <!-- 有人的座位 -->
                <template v-if="getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)?.person">
                  <div class="avatar-container">
                    <svg class="person-avatar-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <!-- 头像背景圆形 -->
                      <circle cx="30" cy="30" r="28" fill="url(#avatarGradient)" stroke="url(#avatarBorder)" stroke-width="2"/>
                      
                      <!-- 渐变定义 -->
                      <defs>
                        <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style="stop-color:#dbeafe;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#bfdbfe;stop-opacity:1" />
                        </linearGradient>
                        
                        <linearGradient id="avatarBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      
                      <!-- 人物头像 -->
                      <g transform="translate(30, 30)">
                        <!-- 头部 -->
                        <circle cx="0" cy="-8" r="10" fill="#fbbf24" opacity="0.9"/>
                        
                        <!-- 眼睛 -->
                        <circle cx="-4" cy="-10" r="1.5" fill="#374151"/>
                        <circle cx="4" cy="-10" r="1.5" fill="#374151"/>
                        
                        <!-- 嘴巴 -->
                        <path d="M -3 -5 Q 0 -3 3 -5" stroke="#374151" stroke-width="1" fill="none" stroke-linecap="round"/>
                        
                        <!-- 身体 -->
                        <rect x="-8" y="2" width="16" height="18" rx="8" fill="#60a5fa" opacity="0.9"/>
                        
                        <!-- 领子 -->
                        <path d="M -6 2 L 0 8 L 6 2" fill="#3b82f6" opacity="0.8"/>
                        
                        <!-- 装饰细节 -->
                        <circle cx="0" cy="8" r="1" fill="rgba(255,255,255,0.6)"/>
                      </g>
                      
                      <!-- 在线状态指示器 -->
                      <circle cx="48" cy="12" r="6" fill="#10b981" opacity="0.9"/>
                      <circle cx="48" cy="12" r="3" fill="#ffffff"/>
                    </svg>
                    
                    <!-- 职务标签 -->
                    <div 
                      v-if="shouldShowPositionTag(getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)?.person?.position)"
                      class="position-tag"
                      :style="{ color: getPositionColor(getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)?.person?.position) }"
                    >
                      {{ getPositionLabel(getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)?.person?.position) }}
                    </div>
                  </div>
                  <div class="person-name">{{ getSeat(desk, 1 + leftSeatsCount + seatIndex - 1)?.person?.name }}</div>
            </template>
            
            <!-- 空座位 -->
            <template v-else>
                  <svg class="empty-seat-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- 空座位背景圆形 -->
                    <circle cx="30" cy="30" r="28" fill="url(#emptyGradient)" stroke="url(#emptyBorder)" stroke-width="2" stroke-dasharray="4 4"/>
                    
                    <!-- 渐变定义 -->
                    <defs>
                      <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f9fafb;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
                      </linearGradient>
                      
                      <linearGradient id="emptyBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#d1d5db;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#9ca3af;stop-opacity:1" />
                      </linearGradient>
                    </defs>
                    
                    <!-- 椅子图标 -->
                    <g transform="translate(30, 30)" opacity="0.5">
                      <!-- 椅背 -->
                      <rect x="-8" y="-15" width="16" height="12" rx="2" fill="#d1d5db" stroke="#9ca3af" stroke-width="1"/>
                      
                      <!-- 座椅 -->
                      <rect x="-10" y="-3" width="20" height="8" rx="4" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>
                      
                      <!-- 椅腿 -->
                      <line x1="-8" y1="5" x2="-8" y2="12" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="5" x2="8" y2="12" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="-8" y1="-3" x2="-8" y2="-8" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="-3" x2="8" y2="-8" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                    </g>
                    
                    <!-- 加号图标表示可添加 -->
                    <g transform="translate(30, 30)" opacity="0.4">
                      <line x1="0" y1="-6" x2="0" y2="6" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
                      <line x1="-6" y1="0" x2="6" y2="0" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
                    </g>
                  </svg>
                  <div class="empty-label">空座</div>
            </template>
              </div>
            </div>
          </div>

          <!-- 下方座位 (固定1个) -->
          <div class="bottom-seats">
            <div
              v-if="props.config && props.config.seats_per_desk > 1"
              :key="`${desk.desk_number}-bottom-${1 + leftSeatsCount + rightSeatsCount}`"
              :class="getSeatSide(1 + leftSeatsCount + rightSeatsCount)"
              class="seat-position"
              :draggable="!!getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)?.person"
              @click="handleSeatClick(getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)!, $event)"
              @dragstart="handleSeatDragStart($event, getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)!)"
              @dragend="handleSeatDragEnd"
              @dragover="handleSeatDragOver"
              @dragleave="handleSeatDragLeave"
              @drop="handleSeatDrop($event, getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)!)"
              @mouseenter="showTooltip($event, getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)!)"
              @mouseleave="hideTooltip"
            >
              <div class="seat-avatar">
                <!-- 有人的座位 -->
                <template v-if="getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)?.person">
                  <div class="avatar-container">
                    <svg class="person-avatar-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <!-- 头像背景圆形 -->
                      <circle cx="30" cy="30" r="28" fill="url(#avatarGradient)" stroke="url(#avatarBorder)" stroke-width="2"/>
                      
                      <!-- 渐变定义 -->
                      <defs>
                        <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style="stop-color:#dbeafe;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#bfdbfe;stop-opacity:1" />
                        </linearGradient>
                        
                        <linearGradient id="avatarBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
                        </linearGradient>
                      </defs>
                      
                      <!-- 人物头像 -->
                      <g transform="translate(30, 30)">
                        <!-- 头部 -->
                        <circle cx="0" cy="-8" r="10" fill="#fbbf24" opacity="0.9"/>
                        
                        <!-- 眼睛 -->
                        <circle cx="-4" cy="-10" r="1.5" fill="#374151"/>
                        <circle cx="4" cy="-10" r="1.5" fill="#374151"/>
                        
                        <!-- 嘴巴 -->
                        <path d="M -3 -5 Q 0 -3 3 -5" stroke="#374151" stroke-width="1" fill="none" stroke-linecap="round"/>
                        
                        <!-- 身体 -->
                        <rect x="-8" y="2" width="16" height="18" rx="8" fill="#60a5fa" opacity="0.9"/>
                        
                        <!-- 领子 -->
                        <path d="M -6 2 L 0 8 L 6 2" fill="#3b82f6" opacity="0.8"/>
                        
                        <!-- 装饰细节 -->
                        <circle cx="0" cy="8" r="1" fill="rgba(255,255,255,0.6)"/>
                      </g>
                      
                      <!-- 在线状态指示器 -->
                      <circle cx="48" cy="12" r="6" fill="#10b981" opacity="0.9"/>
                      <circle cx="48" cy="12" r="3" fill="#ffffff"/>
                    </svg>
                    
                    <!-- 职务标签 -->
                    <div 
                      v-if="shouldShowPositionTag(getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)?.person?.position)"
                      class="position-tag"
                      :style="{ color: getPositionColor(getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)?.person?.position) }"
                    >
                      {{ getPositionLabel(getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)?.person?.position) }}
                    </div>
                  </div>
                  <div class="person-name">{{ getSeat(desk, 1 + leftSeatsCount + rightSeatsCount)?.person?.name }}</div>
                </template>
                
                <!-- 空座位 -->
                <template v-else>
                  <svg class="empty-seat-svg" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- 空座位背景圆形 -->
                    <circle cx="30" cy="30" r="28" fill="url(#emptyGradient)" stroke="url(#emptyBorder)" stroke-width="2" stroke-dasharray="4 4"/>
                    
                    <!-- 渐变定义 -->
                    <defs>
                      <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#f9fafb;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#f3f4f6;stop-opacity:1" />
                      </linearGradient>
                      
                      <linearGradient id="emptyBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#d1d5db;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#9ca3af;stop-opacity:1" />
                      </linearGradient>
                    </defs>
                    
                    <!-- 椅子图标 -->
                    <g transform="translate(30, 30)" opacity="0.5">
                      <!-- 椅背 -->
                      <rect x="-8" y="-15" width="16" height="12" rx="2" fill="#d1d5db" stroke="#9ca3af" stroke-width="1"/>
                      
                      <!-- 座椅 -->
                      <rect x="-10" y="-3" width="20" height="8" rx="4" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1"/>
                      
                      <!-- 椅腿 -->
                      <line x1="-8" y1="5" x2="-8" y2="12" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="5" x2="8" y2="12" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="-8" y1="-3" x2="-8" y2="-8" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                      <line x1="8" y1="-3" x2="8" y2="-8" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
                    </g>
                    
                    <!-- 加号图标表示可添加 -->
                    <g transform="translate(30, 30)" opacity="0.4">
                      <line x1="0" y1="-6" x2="0" y2="6" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
                      <line x1="-6" y1="0" x2="6" y2="0" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
                    </g>
                  </svg>
                  <div class="empty-label">空座</div>
                </template>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      <!-- 滚动提示 -->
      <div v-if="isScrollable" class="mt-2 text-xs text-muted-foreground text-center">
        💡 当前{{ (config?.display_columns || 3) }}列，可左右滚动查看更多桌位
      </div>

      <!-- 座位统计 -->
      <div class="mt-6 pt-4 border-t border-border">
        <div class="flex items-center justify-between text-sm">
          <div class="text-muted-foreground">
            座位统计
          </div>
          <div class="space-x-4">
            <span class="text-foreground">
              总计：<span class="font-semibold">{{ totalSeats }}</span> 个
            </span>
            <span class="text-primary">
              已占：<span class="font-semibold">{{ occupiedSeats }}</span> 个
            </span>
            <span class="text-muted-foreground">
              空闲：<span class="font-semibold">{{ emptySeats }}</span> 个
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬停提示框 -->
    <div
      ref="tooltipRef"
      v-show="tooltipVisible"
      class="fixed z-50 bg-gray-900 text-white text-base rounded-lg px-6 py-4 pointer-events-none shadow-xl min-w-[280px] max-w-[400px]"
      :style="tooltipStyle"
    >
      <div v-if="tooltipData">
        <div class="font-semibold text-lg mb-1">{{ tooltipData.person?.name || '空座位' }}</div>
        <div v-if="tooltipData.person?.student_id" class="opacity-80 text-base mb-1">
          学号：{{ tooltipData.person.student_id }}
        </div>
        <div v-if="tooltipData.person?.ambassador_name" class="opacity-70 mb-1">
          传播大使：{{ tooltipData.person.ambassador_name }}
        </div>
        <div v-if="tooltipData.person?.info" class="opacity-70 mt-2">
          {{ tooltipData.person.info }}
        </div>
        <div v-if="!tooltipData.person" class="opacity-70">
          点击选择人员或拖拽人员到此座位
        </div>
      </div>
    </div>

    <!-- 添加至备选区域标签 -->
    <div
      v-show="addToWaitingVisible"
      class="fixed z-50 pointer-events-none"
      :style="{
        left: addToWaitingPosition.x + 'px',
        top: addToWaitingPosition.y + 'px',
        transform: 'translate(0, 0)'
      }"
    >
      <div 
        class="bg-black/80 text-white text-sm rounded-lg px-4 py-2 shadow-xl backdrop-blur-sm border border-white/20 pointer-events-auto cursor-pointer hover:bg-black/90 transition-colors duration-200"
        @click="handleAddToWaiting"
      >
        <div class="flex items-center space-x-2">
          <span>➕</span>
          <span>添加至备选区域</span>
        </div>
      </div>
      <!-- 小箭头指向左上角的人员头像 -->
      <div class="absolute -left-1 -top-1 w-0 h-0 border-r-4 border-b-4 border-transparent border-r-black/80"></div>
    </div>

    <!-- 人员选择浮窗 -->
    <PersonSelectorModal
      :visible="selectorVisible"
      :waiting-persons="waitingPersons"
      :target-seat="selectedSeat"
      @close="closeSelectorModal"
      @select="handlePersonSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import PersonSelectorModal from './PersonSelectorModal.vue'
import type { Config, DeskLayout, SeatInfo, PersonWithAssignment } from '@/types'
import { useDragAndDrop } from '@/composables/useDragAndDrop'

// ============ Props ============
interface Props {
  layout: DeskLayout[]
  config: Config | null
  loading?: boolean
  tableColor?: string
  waitingPersons?: PersonWithAssignment[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  tableColor: '#e2e8f0',
  waitingPersons: () => []
})

// ============ 职务标签相关 ============

/**
 * 获取职务标签文本
 */
const getPositionLabel = (position?: number): string => {
  switch (position) {
    case 1: return '辅导员'
    case 2: return '助攻手'
    case 3: return '组长'
    case 4: return '副组长'
    case 5: return '学员'
    default: return ''
  }
}

/**
 * 获取职务标签颜色
 */
const getPositionColor = (position?: number): string => {
  switch (position) {
    case 1: return '#ef4444' // 红色 - 辅导员
    case 2: return '#f87171' // 淡红 - 助攻手  
    case 3: return '#d97706' // 土黄色 - 组长
    case 4: return '#f59e0b' // 浅土黄 - 副组长
    case 5: return '' // 学员不显示
    default: return ''
  }
}

/**
 * 是否显示职务标签
 */
const shouldShowPositionTag = (position?: number): boolean => {
  return position !== undefined && position !== 5 && position >= 1 && position <= 4
}

// ============ Emits ============
interface Emits {
  (e: 'seat-drop', data: { seat: SeatInfo, draggedPerson: PersonWithAssignment }): void
  (e: 'seat-click', seat: SeatInfo): void
  (e: 'person-assign', data: { person: PersonWithAssignment, seat: SeatInfo }): void
  (e: 'add-to-waiting', person: PersonWithAssignment): void
}

const emit = defineEmits<Emits>()

// ============ 拖拽组合函数 ============
const {
  startSeatDrag,
  endDrag,
  handleDragOver: dragHandleDragOver,
  handleDragLeave: dragHandleDragLeave,
  parseDragData
} = useDragAndDrop()

// ============ 响应式状态 ============
const draggedSeat = ref<SeatInfo | null>(null)
const tooltipVisible = ref(false)
const tooltipData = ref<SeatInfo | null>(null)
const tooltipRef = ref<HTMLElement>()
const tooltipStyle = ref<Record<string, string>>({})

// 添加至备选区域标签状态
const addToWaitingVisible = ref(false)
const addToWaitingSeat = ref<SeatInfo | null>(null)
const addToWaitingPosition = ref({ x: 0, y: 0 })

// 人员选择浮窗相关状态
const selectorVisible = ref(false)
const selectedSeat = ref<SeatInfo>({
  desk_number: 0,
  seat_number: 0,
  person: undefined
})

// ============ 计算属性 ============

/**
 * 左侧座位数（剩余座位数的一半，奇数时左侧多一个）
 */
const leftSeatsCount = computed(() => {
  if (!props.config) return 3
  const remainingSeats = Math.max(0, props.config.seats_per_desk - 2) // 减去上下2个座位
  return Math.ceil(remainingSeats / 2)
})

/**
 * 右侧座位数（剩余座位数的一半，奇数时右侧少一个）
 */
const rightSeatsCount = computed(() => {
  if (!props.config) return 3
  const remainingSeats = Math.max(0, props.config.seats_per_desk - 2) // 减去上下2个座位
  return Math.floor(remainingSeats / 2)
})

/**
 * 网格列数（实际内容的列数）
 */
const displayColumns = computed(() => {
  if (!props.config) return 3
  const cols = props.config.display_columns || 3
  return Math.max(Math.min(cols, 10), 1)
})

/**
 * 显示区域的最大宽度（始终按3列计算）
 */
// const displayAreaCols = computed(() => {
//   // 显示区域始终最多3列
//   return 3
// })

/**
 * 网格间距类名（始终保持一致，不因列数改变）
 */
const gapClass = computed(() => {
  // 所有情况都使用相同的间距，保持视觉一致性
  return 'gap-12 lg:gap-16'
})

/**
 * 网格样式（关键：4列使用和3列相同的列宽）
 */
const gridStyle = computed(() => {
  if (!props.config) return {}
  
  const cols = displayColumns.value
  
  if (cols <= 3) {
    // 3列以内：使用1fr平均分配，充满容器
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      width: '100%'
    }
  } else {
    // 超过3列：每列使用固定宽度，保持和3列时每列的宽度一样
    // 每列约400px（包含间距），总宽度会超出容器产生滚动
    const columnWidth = '400px'
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, ${columnWidth})`,
      width: 'max-content',
      minWidth: `calc(${cols} * ${columnWidth})`
    }
  }
})

/**
 * 滚动容器的内联样式（限制4列时的显示宽度）
 */
const scrollContainerStyle = computed(() => {
  if (!props.config) return {}
  
  const cols = displayColumns.value
  
  if (cols > 3) {
    // 4列以上：滚动容器宽度限制，只显示3列的空间
    return {
      overflowX: 'auto' as 'auto',
      width: '100%'
    }
  }
  
  return {}
})

/**
 * 检查是否需要滚动（只有超过3列才滚动）
 */
const isScrollable = computed(() => {
  if (!props.config) return false
  
  // 只有设置超过3列才需要滚动
  return displayColumns.value > 3
})

/**
 * 总座位数
 */
const totalSeats = computed(() => {
  return props.layout.reduce((total, desk) => total + desk.seats.length, 0)
})

/**
 * 已占用座位数
 */
const occupiedSeats = computed(() => {
  return props.layout.reduce((total, desk) => 
    total + desk.seats.filter(seat => seat.person).length, 0
  )
})

/**
 * 空座位数
 */
const emptySeats = computed(() => {
  return totalSeats.value - occupiedSeats.value
})

// ============ 方法 ============

/**
 * 获取座位信息
 */
const getSeat = (desk: DeskLayout, seatIndex: number): SeatInfo | null => {
  // 确保座位索引在有效范围内
  if (seatIndex < 0 || seatIndex >= desk.seats.length) {
    return null
  }
  return desk.seats[seatIndex] || null
}

/**
 * 获取座位所在侧面的CSS类名
 */
const getSeatSide = (seatIndex: number) => {
  const leftCount = leftSeatsCount.value
  const rightCount = rightSeatsCount.value
  
  // 座位分配规则：
  // 索引 0: 上方座位
  // 索引 1 到 leftCount: 左侧座位
  // 索引 leftCount+1 到 leftCount+rightCount: 右侧座位  
  // 索引 leftCount+rightCount+1: 下方座位
  
  if (seatIndex === 0) {
    return 'top-seat-0'
  } else if (seatIndex <= leftCount) {
    return `left-seat-${seatIndex - 1}`
  } else if (seatIndex <= leftCount + rightCount) {
    return `right-seat-${seatIndex - leftCount - 1}`
  } else {
    return 'bottom-seat-0'
  }
}

/**
 * 显示添加至备选区域标签
 */
const showAddToWaitingLabel = (seat: SeatInfo, event?: MouseEvent) => {
  if (event) {
    // 查找座位头像元素
    const target = event.target as HTMLElement
    const seatAvatar = target.closest('.seat-position')?.querySelector('.seat-avatar')
    
    if (seatAvatar) {
      const rect = seatAvatar.getBoundingClientRect()
      addToWaitingPosition.value = {
        x: rect.right - 10,  // 从头像右边缘向内稍微偏移
        y: rect.bottom - 10  // 从头像底边向上稍微偏移
      }
    } else {
      // 备用方案：使用点击目标的位置
      const rect = target.getBoundingClientRect()
      addToWaitingPosition.value = {
        x: rect.right - 10,
        y: rect.bottom - 10
      }
    }
  }
  addToWaitingSeat.value = seat
  addToWaitingVisible.value = true
  
  // 3秒后自动隐藏
  setTimeout(() => {
    hideAddToWaitingLabel()
  }, 3000)
}

/**
 * 隐藏添加至备选区域标签
 */
const hideAddToWaitingLabel = () => {
  addToWaitingVisible.value = false
  addToWaitingSeat.value = null
}

/**
 * 处理添加至备选区域
 */
const handleAddToWaiting = () => {
  if (addToWaitingSeat.value?.person) {
    emit('add-to-waiting', addToWaitingSeat.value.person)
    hideAddToWaitingLabel()
    console.log(`➕ 添加至备选区域：`, addToWaitingSeat.value.person.name)
  }
}

/**
 * 处理座位点击
 */
const handleSeatClick = (seat: SeatInfo, event?: MouseEvent) => {
  // 如果座位为空且有备选人员，显示人员选择浮窗
  if (!seat.person && props.waitingPersons.length > 0) {
    selectedSeat.value = seat
    selectorVisible.value = true
    console.log(`👆 空座位点击，显示人员选择浮窗`)
  } else if (seat.person) {
    // 如果座位有人，显示"添加至备选区域"标签
    showAddToWaitingLabel(seat, event)
    console.log(`👆 有人座位点击，显示添加至备选区域标签`)
  } else {
    // 原有的座位点击逻辑
    emit('seat-click', seat)
    console.log(`👆 座位点击：`, seat)
  }
}

/**
 * 处理座位拖拽开始
 */
const handleSeatDragStart = (event: DragEvent, seat: SeatInfo) => {
  if (!seat.person) {
    console.warn('⚠️ 座位为空，无法拖拽')
    return
  }
  
  draggedSeat.value = seat
  console.log('🚀 开始拖拽座位人员:', seat.person.name, '从座位:', seat.desk_number, seat.seat_number)
  
  // 使用拖拽组合函数处理座位拖拽
  const success = startSeatDrag(event, seat, seat.person)
  
  if (success) {
    // 添加拖拽样式
    if (event.target instanceof HTMLElement) {
      event.target.classList.add('dragging')
    }
    console.log('✅ 座位拖拽开始成功:', seat.person?.name)
  } else {
    console.warn('⚠️ 座位拖拽开始失败')
  }
}

/**
 * 处理座位拖拽结束
 */
const handleSeatDragEnd = (event: DragEvent) => {
  // 使用拖拽组合函数处理拖拽结束
  endDrag()
  
  // 移除拖拽样式
  if (event.target instanceof HTMLElement) {
    event.target.classList.remove('dragging')
  }
  
  // 清理所有可能残留的悬停样式（防止样式残留）
  const allSeats = document.querySelectorAll('.seat-position')
  allSeats.forEach((seat) => {
    seat.classList.remove('drop-zone', 'drag-over')
  })
  
  draggedSeat.value = null
  console.log('🏁 拖拽结束，清理悬停样式')
}

/**
 * 处理座位拖拽悬停
 */
const handleSeatDragOver = (event: DragEvent) => {
  event.preventDefault()
  
  // 使用拖拽组合函数处理拖拽悬停
  dragHandleDragOver(event, 'seat-target')
  
  // 添加悬停样式
  if (event.target instanceof HTMLElement) {
    event.target.classList.add('drop-zone', 'drag-over')
  }
}

/**
 * 处理座位拖拽离开
 */
const handleSeatDragLeave = (event: DragEvent) => {
  // 使用拖拽组合函数处理拖拽离开
  dragHandleDragLeave('seat-target')
  
  // 移除悬停样式
  if (event.target instanceof HTMLElement) {
    event.target.classList.remove('drop-zone', 'drag-over')
  }
}

/**
 * 处理座位拖拽放置
 */
const handleSeatDrop = (event: DragEvent, targetSeat: SeatInfo) => {
  event.preventDefault()
  
  // 移除悬停样式
  if (event.target instanceof HTMLElement) {
    event.target.classList.remove('drop-zone', 'drag-over')
  }
  
  if (!event.dataTransfer) return
  
  // 使用拖拽组合函数解析拖拽数据
  const dragData = parseDragData(event.dataTransfer)
  
  if (!dragData) {
    console.warn('⚠️ 无效的拖拽数据')
    return
  }
  
  if (dragData.type === 'seat' && dragData.person) {
    // 座位之间的交换
    console.log('🎯 座位拖拽放置:', dragData.person.name, '→', targetSeat)
    emit('seat-drop', {
      seat: targetSeat,
      draggedPerson: dragData.person,
      dragType: 'seat',
      sourceDesk: dragData.sourceDesk,
      sourceSeat: dragData.sourceSeat
    })
  } else if (dragData.type === 'person' && dragData.person) {
    // 从备选区拖拽到座位
    console.log('🎯 备选区拖拽到座位:', dragData.person.name, '→', targetSeat)
    emit('seat-drop', {
      seat: targetSeat,
      draggedPerson: dragData.person,
      dragType: 'person'
    })
  } else {
    console.warn('⚠️ 不支持的拖拽类型:', dragData.type)
  }
}

/**
 * 显示悬停提示
 */
const showTooltip = (event: MouseEvent, seat: SeatInfo) => {
  tooltipData.value = seat
  tooltipVisible.value = true
  
  nextTick(() => {
    updateTooltipPosition(event)
  })
}

/**
 * 隐藏悬停提示
 */
const hideTooltip = () => {
  tooltipVisible.value = false
  tooltipData.value = null
}

/**
 * 更新提示框位置
 */
const updateTooltipPosition = (event: MouseEvent) => {
  const mouseX = event.clientX
  const mouseY = event.clientY
  const offset = 10
  
  tooltipStyle.value = {
    left: `${mouseX + offset}px`,
    top: `${mouseY - offset}px`,
    transform: 'translateY(-100%)'
  }
}

// ============ 颜色处理工具函数 ============

/**
 * 颜色变亮处理
 */
const lightenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}

/**
 * 颜色变暗处理
 */
const darkenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) - amt
  const G = (num >> 8 & 0x00FF) - amt
  const B = (num & 0x0000FF) - amt
  return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1)
}

// ============ 事件监听 ============

// 监听鼠标移动来更新提示框位置
const handleMouseMove = (event: MouseEvent) => {
  if (tooltipVisible.value) {
    updateTooltipPosition(event)
  }
}

// 在组件挂载时添加全局鼠标移动监听
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})

// ============ 人员选择浮窗处理 ============

/**
 * 关闭人员选择浮窗
 */
const closeSelectorModal = () => {
  selectorVisible.value = false
  console.log('🚪 关闭人员选择浮窗')
}

/**
 * 处理人员选择
 */
const handlePersonSelection = (data: { person: PersonWithAssignment, seat: SeatInfo }) => {
  console.log(`✅ 人员选择：${data.person.name}`)
  
  // 关闭浮窗
  selectorVisible.value = false
  
  // 发送人员分配事件
  emit('person-assign', data)
}
</script>

<style scoped>
/* 座位区域滚动容器样式 */
.seating-scroll-container {
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.seating-scroll-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.seating-scroll-container::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.seating-scroll-container::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 4px;
}

.seating-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

/* 座位区域容器样式 */
.seating-scroll-container {
  /* 充满整个座位区域 */
  width: 100%;
}

/* 网格容器动态宽度 */
.seating-scroll-container .grid {
  /* 宽度通过 :style 动态设置 */
  /* 1-3列：width: 100% 充满容器 */
  /* 4列以上：width: max-content 按内容宽度，自然溢出滚动 */
}

/* 固定列数的CSS类 */
.grid-cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.grid-cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.grid-cols-6 {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.grid-cols-7 {
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.grid-cols-8 {
  grid-template-columns: repeat(8, minmax(0, 1fr));
}

.grid-cols-9 {
  grid-template-columns: repeat(9, minmax(0, 1fr));
}

.grid-cols-10 {
  grid-template-columns: repeat(10, minmax(0, 1fr));
}

/* 桌子容器动画 */
.desk-container.fade-in {
  animation: fadeInUp 0.6s ease-out forwards;
}

/* 长方形桌子布局样式 */
.rectangular-desk-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 500px;
  margin: 2rem 0;
  padding: 2rem;
}

.rectangular-desk-container.fade-in {
  animation: fadeInUp 0.6s ease-out forwards;
}

/* 桌布容器 */
.table-cloth-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

/* 桌布SVG */
.table-cloth-svg {
  width: 120px;
  height: 240px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

/* 桌子标签 */
.desk-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 700;
  font-size: 14px;
  color: #475569;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  z-index: 2;
}

/* 上方座位容器 */
.top-seats {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  z-index: 10;
}

/* 下方座位容器 */
.bottom-seats {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  z-index: 10;
}

/* 左侧座位容器 */
.left-seats {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
}

/* 右侧座位容器 */
.right-seats {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
}

/* 座位位置 */
.seat-position {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.seat-position:hover {
  transform: scale(1.05);
}

/* 座位头像容器 */
.seat-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.seat-avatar:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 头像容器 */
.avatar-container {
  position: relative;
  display: inline-block;
}

/* 人物头像SVG */
.person-avatar-svg {
  width: 50px;
  height: 50px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* 职务标签 */
.position-tag {
  position: absolute;
  top: -4px;
  right: -10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  z-index: 10;
  white-space: nowrap;
  min-width: 28px;
  text-align: center;
}

/* 空座位SVG */
.empty-seat-svg {
  width: 50px;
  height: 50px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.seat-position:hover .empty-seat-svg {
  opacity: 0.8;
}

/* 人员姓名 */
.person-name {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  max-width: 80px;
  word-wrap: break-word;
  line-height: 1.2;
}

/* 空座标签 */
.empty-label {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
  text-align: center;
}

/* 拖拽状态 */
.seat-position[draggable="true"] .seat-avatar {
  cursor: grab;
}

.seat-position[draggable="true"]:active .seat-avatar {
  cursor: grabbing;
  transform: scale(0.95);
}

/* 拖拽悬停状态 */
.seat-position.drop-zone {
  transform: scale(1.1);
}

.seat-position.drop-zone .seat-avatar {
  background: rgba(59, 130, 246, 0.1);
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .rectangular-desk-container {
    min-height: 400px;
    padding: 1rem;
  }
  
  .table-cloth-svg {
    width: 100px;
    height: 200px;
  }
  
  .left-seats, .right-seats {
    gap: 8px;
  }
  
  .person-avatar-svg, .empty-seat-svg {
    width: 40px;
    height: 40px;
  }
  
  .person-name {
    font-size: 10px;
    max-width: 60px;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
