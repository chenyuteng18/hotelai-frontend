<template>
  <div class="onboarding-page">
    <div class="page-header">
      <h1>开户向导</h1>
      <p>引导完成酒店账户开通与基础配置</p>
    </div>
    <div class="wizard-progress" role="navigation" aria-label="开户步骤">
      <div
        v-for="(step, i) in steps"
        :key="i"
        class="wizard-step"
        :class="{ 'wizard-step--active': currentStep === i, 'wizard-step--done': currentStep > i }"
      >
        <span class="wizard-step__number" :aria-label="'步骤 ' + (i + 1)">{{ i + 1 }}</span>
        <span class="wizard-step__label">{{ step.title }}</span>
      </div>
    </div>
    <div class="card wizard-content">
      <div v-if="currentStep === 0" class="step-form">
        <h2>基本信息</h2>
        <div class="form-group">
          <label class="form-label" for="hotelName">酒店名称</label>
          <input id="hotelName" v-model="form.hotelName" class="form-input" placeholder="请输入酒店名称" />
        </div>
        <div class="form-group">
          <label class="form-label" for="hotelAddress">酒店地址</label>
          <input id="hotelAddress" v-model="form.hotelAddress" class="form-input" placeholder="请输入酒店地址" />
        </div>
        <div class="form-group">
          <label class="form-label" for="hotelType">酒店类型</label>
          <select id="hotelType" v-model="form.hotelType" class="form-input">
            <option value="">请选择</option>
            <option value="business">商务酒店</option>
            <option value="resort">度假酒店</option>
            <option value="boutique">精品酒店</option>
            <option value="chain">连锁酒店</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="totalRooms">房间总数</label>
          <input id="totalRooms" v-model.number="form.totalRooms" type="number" class="form-input" placeholder="请输入房间总数" />
        </div>
      </div>
      <div v-if="currentStep === 1" class="step-form">
        <h2>房型配置</h2>
        <div v-for="(room, i) in form.roomTypes" :key="i" class="room-type-row">
          <input v-model="room.name" class="form-input" :placeholder="'房型 ' + (i + 1) + ' 名称'" :aria-label="'房型 ' + (i + 1) + ' 名称'" />
          <input v-model.number="room.count" type="number" class="form-input form-input--sm" placeholder="数量" :aria-label="'房型 ' + (i + 1) + ' 数量'" />
          <input v-model.number="room.basePrice" type="number" class="form-input form-input--sm" placeholder="基准价" :aria-label="'房型 ' + (i + 1) + ' 基准价'" />
          <button class="btn btn-danger btn-sm" :aria-label="'删除房型 ' + (i + 1)" @click="removeRoomType(i)">删除</button>
        </div>
        <button class="btn" @click="addRoomType">+ 添加房型</button>
      </div>
      <div v-if="currentStep === 2" class="step-form">
        <h2>管理员账户</h2>
        <div class="form-group">
          <label class="form-label" for="adminName">管理员姓名</label>
          <input id="adminName" v-model="form.adminName" class="form-input" placeholder="请输入管理员姓名" />
        </div>
        <div class="form-group">
          <label class="form-label" for="adminEmail">管理员邮箱</label>
          <input id="adminEmail" v-model="form.adminEmail" type="email" class="form-input" placeholder="请输入管理员邮箱" />
        </div>
        <div class="form-group">
          <label class="form-label" for="adminPhone">联系电话</label>
          <input id="adminPhone" v-model="form.adminPhone" class="form-input" placeholder="请输入联系电话" />
        </div>
      </div>
      <div v-if="currentStep === 3" class="step-form">
        <h2>确认信息</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">酒店名称</span>
            <span class="summary-value">{{ form.hotelName || '—' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">酒店地址</span>
            <span class="summary-value">{{ form.hotelAddress || '—' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">酒店类型</span>
            <span class="summary-value">{{ hotelTypeLabel }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">房间总数</span>
            <span class="summary-value">{{ form.totalRooms || '—' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">房型数量</span>
            <span class="summary-value">{{ form.roomTypes.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">管理员</span>
            <span class="summary-value">{{ form.adminName || '—' }}</span>
          </div>
        </div>
      </div>
      <div class="wizard-actions">
        <button v-if="currentStep > 0" class="btn" @click="currentStep--">上一步</button>
        <button v-if="currentStep < steps.length - 1" class="btn btn-primary" @click="currentStep++">下一步</button>
        <button v-if="currentStep === steps.length - 1" class="btn btn-primary" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '完成开户' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentStep = ref(0)
const submitting = ref(false)

const steps = [
  { title: '基本信息' },
  { title: '房型配置' },
  { title: '管理员账户' },
  { title: '确认提交' },
]

const form = reactive({
  hotelName: '',
  hotelAddress: '',
  hotelType: '',
  totalRooms: 0,
  roomTypes: [{ name: '', count: 0, basePrice: 0 }],
  adminName: '',
  adminEmail: '',
  adminPhone: '',
})

const hotelTypeLabel = computed(() => {
  const map: Record<string, string> = { business: '商务酒店', resort: '度假酒店', boutique: '精品酒店', chain: '连锁酒店' }
  return map[form.hotelType] || '—'
})

function addRoomType() {
  form.roomTypes.push({ name: '', count: 0, basePrice: 0 })
}

function removeRoomType(index: number) {
  form.roomTypes.splice(index, 1)
}

async function handleSubmit() {
  submitting.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push('/dashboard')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.wizard-progress {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.wizard-step {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.wizard-step--active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 600;
}

.wizard-step--done {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.wizard-step__number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: currentColor;
  color: #fff;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.wizard-step--active .wizard-step__number {
  background: var(--color-primary);
}

.wizard-step--done .wizard-step__number {
  background: var(--color-success);
}

.wizard-content {
  max-width: 640px;
}

.step-form h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.room-type-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  align-items: center;
}

.form-input--sm {
  max-width: 120px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: var(--font-size-xs);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.summary-item {
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.summary-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-xs);
}

.summary-value {
  font-weight: 600;
}

.wizard-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}
</style>
