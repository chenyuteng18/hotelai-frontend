<template>
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="visible" class="toast-container" role="alert" aria-live="polite">
        <div class="toast" :class="'toast--' + type">
          <span class="toast__icon">{{ iconMap[type] }}</span>
          <span class="toast__message">{{ message }}</span>
          <button v-if="retryable" class="toast__retry" @click="$emit('retry')">重试</button>
          <button class="toast__close" aria-label="关闭" @click="dismiss">&times;</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  message: string
  type?: 'error' | 'success' | 'warning'
  retryable?: boolean
  duration?: number
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'retry'): void
}>()

const visible = ref(false)
const iconMap = { error: '❌', success: '✅', warning: '⚠️' }

let timer: ReturnType<typeof setTimeout> | null = null

function dismiss() {
  visible.value = false
  emit('update:show', false)
}

watch(() => props.show, (val) => {
  if (val) {
    visible.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(dismiss, props.duration || 5000)
  }
}, { immediate: true })
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 9999;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-sm);
  max-width: 400px;
  min-width: 280px;
}

.toast--error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.toast--success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.toast--warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.toast__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.toast__message {
  flex: 1;
}

.toast__retry {
  background: none;
  border: 1px solid currentColor;
  color: inherit;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  white-space: nowrap;
}

.toast__retry:hover {
  opacity: 0.8;
}

.toast__close {
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.6;
  padding: 0 2px;
}

.toast__close:hover {
  opacity: 1;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
