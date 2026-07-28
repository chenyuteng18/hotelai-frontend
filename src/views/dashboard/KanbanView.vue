<template>
  <div class="kanban">
    <div class="page-header">
      <h1>收益看板</h1>
      <p>多维度收益指标看板</p>
    </div>
    <div v-if="!columns.length" class="empty-state">
      <p>暂无看板数据</p>
      <p class="empty-hint">请检查数据服务是否正常连接，或点击刷新重试</p>
    </div>
    <div v-else class="kanban-board">
      <div v-for="col in columns" :key="col.id" class="kanban-column">
        <h2 class="kanban-column__title">{{ col.title }}</h2>
        <div class="kanban-column__cards">
          <div v-for="card in col.items" :key="card.id" class="card kanban-card">
            <span class="kanban-card__title">{{ card.title }}</span>
            <span class="kanban-card__value">{{ card.metric }} {{ card.value }}</span>
            <span class="kanban-card__change" :class="card.status">
              {{ card.status === 'up' ? '↑' : card.status === 'down' ? '↓' : '→' }}
              {{ Math.abs(card.change) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
    <AppToast :show="toastVisible" :message="toastMessage" type="error" :retryable="true" @update:show="toastVisible = $event" @retry="fetchColumns" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { kanbanApi } from '../../services/api'
import type { KanbanColumn } from '../../types'
import AppToast from '../../components/common/AppToast.vue'

const columns = ref<KanbanColumn[]>([])
const toastVisible = ref(false)
const toastMessage = ref('')

async function fetchColumns() {
  try {
    const { data } = await kanbanApi.getColumns()
    columns.value = data.data
  } catch (error) {
    toastMessage.value = '获取看板数据失败，请稍后重试'
    toastVisible.value = true
    columns.value = [
      {
        id: 'revenue',
        title: '收益指标',
        items: [
          { id: 1, title: '今日收益', metric: '¥', value: 128600, change: 4.2, status: 'up' },
          { id: 2, title: '本周收益', metric: '¥', value: 856000, change: -1.3, status: 'down' },
        ],
      },
      {
        id: 'occupancy',
        title: '入住指标',
        items: [
          { id: 3, title: '今日入住率', metric: '', value: 87, change: 2.1, status: 'up' },
          { id: 4, title: '预订转化率', metric: '', value: 34, change: 0, status: 'stable' },
        ],
      },
      {
        id: 'pricing',
        title: '定价指标',
        items: [
          { id: 5, title: '平均房价', metric: '¥', value: 682, change: 3.5, status: 'up' },
          { id: 6, title: '价格竞争力', metric: '', value: 91, change: -0.8, status: 'down' },
        ],
      },
    ]
  }
}

onMounted(fetchColumns)
</script>

<style scoped>
.kanban-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
  align-items: start;
}

.kanban-column__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-primary);
}

.kanban-column__cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.kanban-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
}

.kanban-card__title {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.kanban-card__value {
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.kanban-card__change {
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.kanban-card__change.up {
  color: var(--color-success);
}

.kanban-card__change.down {
  color: var(--color-error);
}

.kanban-card__change.stable {
  color: var(--color-text-tertiary);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-tertiary);
}

.empty-hint {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}
</style>
