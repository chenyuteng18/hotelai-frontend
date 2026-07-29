<template>
  <div class="rooms-page">
    <div class="page-header">
      <h1>房间管理</h1>
      <p>实时房态与智能定价建议</p>
    </div>
    <div class="filter-bar">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        class="btn filter-btn"
        :class="{ 'btn-primary': activeStatus === f.value }"
        :aria-pressed="activeStatus === f.value"
        @click="activeStatus = f.value; page = 1"
      >
        {{ f.label }}
      </button>
    </div>
    <div class="room-grid">
      <div v-for="room in paginatedRooms" :key="room.id" class="card room-card">
        <div class="room-card__header">
          <span class="room-card__number">{{ room.number }}</span>
          <span class="status-tag" :class="roomStatusClass(room.status)">{{ roomStatusLabel(room.status) }}</span>
        </div>
        <div class="room-card__info">
          <span>{{ room.floor }} 层</span>
        </div>
        <div class="room-card__pricing">
          <div class="price-item">
            <span class="price-label">当前价</span>
            <span class="price-value">{{ formatCurrency(room.currentPrice) }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">建议价</span>
            <span class="price-value price-value--suggested">{{ formatCurrency(room.suggestedPrice) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!filteredRooms.length" class="empty-state">
      <p>暂无房间数据</p>
      <p class="empty-hint">请添加房间或检查筛选条件</p>
    </div>
    <div v-if="filteredRooms.length > pageSize" class="pagination">
      <button class="btn btn-sm" :disabled="page === 1" @click="page--">上一页</button>
      <span class="pagination__info">{{ page }} / {{ totalPages }}</span>
      <button class="btn btn-sm" :disabled="page === totalPages" @click="page++">下一页</button>
    </div>
    <AppToast :show="toastVisible" :message="toastMessage" type="error" :retryable="true" @update:show="toastVisible = $event" @retry="fetchRooms" />
    <ConfirmDialog
      :show="confirmShow"
      :title="confirmTitle"
      :message="confirmMessage"
      type="danger"
      confirm-text="确认"
      cancel-text="取消"
      @update:show="confirmShow = $event"
      @confirm="handleConfirm"
      @cancel="confirmShow = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { roomApi } from '../../services/api'
import type { Room } from '../../types'
import AppToast from '../../components/common/AppToast.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'
import { formatCurrency } from '../../utils/format'

const rooms = ref<Room[]>([])
const activeStatus = ref('all')

const page = ref(1)
const pageSize = 20

const toastVisible = ref(false)
const toastMessage = ref('')

const confirmShow = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
let confirmAction: (() => void) | null = null

const statusFilters = [
  { label: '全部', value: 'all' },
  { label: '空闲', value: 'available' },
  { label: '已入住', value: 'occupied' },
  { label: '已预订', value: 'reserved' },
  { label: '维护中', value: 'maintenance' },
]

const filteredRooms = computed(() => {
  if (activeStatus.value === 'all') return rooms.value
  return rooms.value.filter((r) => r.status === activeStatus.value)
})

const totalPages = computed(() => Math.ceil(filteredRooms.value.length / pageSize))

const paginatedRooms = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredRooms.value.slice(start, start + pageSize)
})

function roomStatusClass(s: string) {
  if (s === 'available') return 'status-tag--success'
  if (s === 'occupied') return 'status-tag--info'
  if (s === 'reserved') return 'status-tag--warning'
  return 'status-tag--default'
}

function roomStatusLabel(s: string) {
  if (s === 'available') return '空闲'
  if (s === 'occupied') return '已入住'
  if (s === 'reserved') return '已预订'
  return '维护中'
}

function handleConfirm() {
  confirmShow.value = false
  if (confirmAction) {
    confirmAction()
    confirmAction = null
  }
}

async function fetchRooms() {
  try {
    const { data } = await roomApi.getList()
    rooms.value = data.data.items
  } catch {
    toastMessage.value = '获取房间列表失败，请稍后重试'
    toastVisible.value = true
  }
}

onMounted(() => {
  fetchRooms()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  font-size: var(--font-size-sm);
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-md);
}

.room-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.room-card__number {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.room-card__info {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-md);
}

.room-card__pricing {
  display: flex;
  gap: var(--spacing-lg);
}

.price-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.price-value {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.price-value--suggested {
  color: var(--color-primary);
}

.empty-state {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: var(--spacing-xxl);
}

.empty-hint {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.pagination__info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.btn-sm {
  padding: 4px 10px;
  font-size: var(--font-size-xs);
}
</style>
