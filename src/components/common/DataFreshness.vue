<template>
  <div class="freshness" :class="{ 'freshness--stale': isStale }" role="status">
    <span class="freshness__icon" aria-hidden="true">{{ isStale ? '⚠️' : '🕐' }}</span>
    <span class="freshness__text">
      采集时间：{{ lastUpdated || '未知' }}
      <span v-if="isStale" class="freshness__warning">（数据已超过 {{ staleThreshold }} 小时未更新）</span>
    </span>
    <button v-if="isStale" class="btn btn-sm freshness__refresh" @click="$emit('refresh')">
      刷新数据
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  lastUpdated: string
  staleThreshold?: number
}>(), {
  staleThreshold: 2,
})

defineEmits<{
  refresh: []
}>()

const isStale = computed(() => {
  if (!props.lastUpdated || props.lastUpdated === '未知') return true
  const updated = new Date(props.lastUpdated).getTime()
  const diff = Date.now() - updated
  return diff > props.staleThreshold * 60 * 60 * 1000
})
</script>

<style scoped>
.freshness {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.freshness--stale {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
}

.freshness__icon {
  font-size: 14px;
}

.freshness__warning {
  color: var(--color-warning);
  font-weight: 500;
}

.freshness__refresh {
  margin-left: auto;
}

.btn-sm {
  padding: 2px 8px;
  font-size: var(--font-size-xs);
}
</style>
