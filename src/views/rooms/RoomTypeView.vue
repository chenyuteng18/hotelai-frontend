<template>
  <div class="room-types-page">
    <div class="page-header">
      <h1>房型管理</h1>
      <p>房型配置与库存概览</p>
    </div>
    <div class="type-grid">
      <div v-for="rt in roomTypes" :key="rt.id" class="card type-card">
        <h2 class="type-card__name">{{ rt.name }}</h2>
        <div class="type-card__metrics">
          <div class="metric">
            <span class="metric__label">基准价</span>
            <span class="metric__value">¥{{ rt.basePrice }}</span>
          </div>
          <div class="metric">
            <span class="metric__label">容量</span>
            <span class="metric__value">{{ rt.capacity }} 人</span>
          </div>
          <div class="metric">
            <span class="metric__label">总房间</span>
            <span class="metric__value">{{ rt.totalRooms }}</span>
          </div>
          <div class="metric">
            <span class="metric__label">可用</span>
            <span class="metric__value metric__value--available">{{ rt.availableRooms }}</span>
          </div>
        </div>
        <div class="type-card__amenities">
          <span v-for="a in rt.amenities" :key="a" class="amenity-tag">{{ a }}</span>
        </div>
        <div class="type-card__availability">
          <div class="progress-bar" role="img" :aria-label="'可用率 ' + availabilityPercent(rt) + '%'">
            <div
              class="progress-bar__fill"
              :class="availabilityPercent(rt) > 50 ? 'progress-bar__fill--safe' : availabilityPercent(rt) > 20 ? 'progress-bar__fill--warning' : 'progress-bar__fill--danger'"
              :style="{ width: availabilityPercent(rt) + '%' }"
            ></div>
          </div>
          <span class="availability-text">可用率 {{ availabilityPercent(rt) }}%</span>
        </div>
      </div>
    </div>
    <div v-if="!roomTypes.length" class="empty-state">
      <p>暂无房型数据</p>
      <p class="empty-hint">请添加房型或检查网络连接后重试</p>
    </div>
    <AppToast :show="toastVisible" :message="toastMessage" type="error" :retryable="true" @update:show="toastVisible = $event" @retry="fetchRoomTypes" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { roomApi } from '../../services/api'
import type { RoomType } from '../../types'
import AppToast from '../../components/common/AppToast.vue'

const roomTypes = ref<RoomType[]>([])

const toastVisible = ref(false)
const toastMessage = ref('')

function availabilityPercent(rt: RoomType) {
  if (!rt.totalRooms) return 0
  return Math.round((rt.availableRooms / rt.totalRooms) * 100)
}

async function fetchRoomTypes() {
  try {
    const { data } = await roomApi.getTypes()
    roomTypes.value = data.data
  } catch {
    toastMessage.value = '获取房型列表失败，请稍后重试'
    toastVisible.value = true
  }
}

onMounted(() => {
  fetchRoomTypes()
})
</script>

<style scoped>
.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.type-card__name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.type-card__metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.metric__label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.metric__value {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.metric__value--available {
  color: var(--color-success);
}

.type-card__amenities {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.amenity-tag {
  font-size: var(--font-size-xs);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.type-card__availability {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.type-card__availability .progress-bar {
  flex: 1;
}

.availability-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
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
</style>
