<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-card card" role="alertdialog" :aria-label="title">
          <div class="confirm-card__icon">{{ type === 'danger' ? '⚠️' : '📋' }}</div>
          <h3 class="confirm-card__title">{{ title }}</h3>
          <p class="confirm-card__message">{{ message }}</p>
          <div class="confirm-card__actions">
            <button class="btn" @click="handleCancel">{{ cancelText }}</button>
            <button
              class="btn"
              :class="type === 'danger' ? 'btn-danger' : 'btn-primary'"
              :disabled="confirming"
              @click="handleConfirm"
            >
              {{ confirming ? '处理中...' : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'default' | 'danger'
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const visible = ref(false)
const confirming = ref(false)

watch(() => props.show, (val) => {
  visible.value = val
  confirming.value = false
})

function handleCancel() {
  visible.value = false
  emit('update:show', false)
  emit('cancel')
}

async function handleConfirm() {
  confirming.value = true
  emit('confirm')
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.confirm-card {
  max-width: 420px;
  width: 90%;
  padding: var(--spacing-xl);
  text-align: center;
}

.confirm-card__icon {
  font-size: 36px;
  margin-bottom: var(--spacing-md);
}

.confirm-card__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.confirm-card__message {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.5;
}

.confirm-card__actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.confirm-card__actions .btn {
  min-width: 100px;
}

.btn-danger {
  background: var(--color-error);
  color: #fff;
  border: none;
}

.btn-danger:hover {
  opacity: 0.9;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .confirm-card,
.modal-fade-leave-to .confirm-card {
  transform: scale(0.95);
}
</style>
