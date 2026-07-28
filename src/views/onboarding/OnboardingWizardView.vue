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
        <h2>定价偏好</h2>
        <p class="step-desc">帮助我们了解您的定价风格，生成个性化策略</p>

        <div class="form-group">
          <label class="form-label">1. 风险偏好</label>
          <div class="card-select-group">
            <div
              v-for="opt in riskOptions"
              :key="opt.value"
              class="card-select"
              :class="{ 'card-select--active': strategyProfile.riskPreference === opt.value }"
              @click="strategyProfile.riskPreference = opt.value"
            >
              <span class="card-select__icon">{{ opt.icon }}</span>
              <span class="card-select__title">{{ opt.label }}</span>
              <span class="card-select__desc">{{ opt.desc }}</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="targetOccupancy">2. 目标入住率</label>
          <div class="slider-group">
            <input
              id="targetOccupancy"
              v-model.number="strategyProfile.targetOccupancy"
              type="range"
              min="50"
              max="95"
              step="5"
              class="slider"
            />
            <span class="slider-value">{{ strategyProfile.targetOccupancy }}%</span>
          </div>
          <p class="form-hint">建议范围：商务酒店 75-85%，度假酒店 60-75%</p>
        </div>

        <div class="form-group">
          <label class="form-label">3. 竞对关注度</label>
          <div class="card-select-group">
            <div
              v-for="opt in competitorOptions"
              :key="opt.value"
              class="card-select"
              :class="{ 'card-select--active': strategyProfile.competitorAttention === opt.value }"
              @click="strategyProfile.competitorAttention = opt.value"
            >
              <span class="card-select__icon">{{ opt.icon }}</span>
              <span class="card-select__title">{{ opt.label }}</span>
              <span class="card-select__desc">{{ opt.desc }}</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">4. 单次调价接受幅度</label>
          <div class="radio-group">
            <label v-for="opt in priceChangeOptions" :key="opt" class="radio-label">
              <input type="radio" :value="opt" v-model="strategyProfile.maxPriceChange" />
              {{ opt }}%
            </label>
          </div>
        </div>

        <div v-if="showStrategySummary" class="strategy-summary-card">
          <h3>策略摘要</h3>
          <div class="strategy-summary__grid">
            <div class="strategy-summary__item">
              <span class="strategy-summary__label">算法模式</span>
              <span class="strategy-summary__value">{{ strategySummary.algorithmMode }}</span>
            </div>
            <div class="strategy-summary__item">
              <span class="strategy-summary__label">收益权重</span>
              <span class="strategy-summary__value">{{ strategySummary.revenueWeight }}%</span>
            </div>
            <div class="strategy-summary__item">
              <span class="strategy-summary__label">入住率权重</span>
              <span class="strategy-summary__value">{{ strategySummary.occupancyWeight }}%</span>
            </div>
            <div class="strategy-summary__item">
              <span class="strategy-summary__label">调幅上限</span>
              <span class="strategy-summary__value">{{ strategySummary.maxChange }}%</span>
            </div>
            <div class="strategy-summary__item">
              <span class="strategy-summary__label">竞对跟随度</span>
              <span class="strategy-summary__value">{{ strategySummary.competitorFollow }}%</span>
            </div>
            <div class="strategy-summary__item">
              <span class="strategy-summary__label">目标入住率</span>
              <span class="strategy-summary__value">{{ strategyProfile.targetOccupancy }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="currentStep === 4" class="step-form">
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
          <div class="summary-item">
            <span class="summary-label">风险偏好</span>
            <span class="summary-value">{{ riskLabel }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">目标入住率</span>
            <span class="summary-value">{{ strategyProfile.targetOccupancy }}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">调价幅度</span>
            <span class="summary-value">{{ strategyProfile.maxPriceChange }}%</span>
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
    <AppToast :show="toastVisible" :message="toastMessage" type="error" :retryable="true" @update:show="toastVisible = $event" @retry="handleSubmit" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '../../services/api'
import AppToast from '../../components/common/AppToast.vue'

const router = useRouter()
const currentStep = ref(0)
const submitting = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')

const steps = [
  { title: '基本信息' },
  { title: '房型配置' },
  { title: '管理员账户' },
  { title: '定价偏好' },
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

const strategyProfile = reactive({
  riskPreference: 'balanced',
  targetOccupancy: 80,
  competitorAttention: 'reference',
  maxPriceChange: 10,
})

const riskOptions = [
  { value: 'conservative', icon: '🛡️', label: '保守稳健', desc: '优先保障入住率，价格波动小' },
  { value: 'balanced', icon: '⚖️', label: '均衡', desc: '入住率与收益兼顾' },
  { value: 'aggressive', icon: '🚀', label: '积极进取', desc: '追求收益最大化，接受波动' },
]

const competitorOptions = [
  { value: 'follow', icon: '👁️', label: '完全跟随', desc: '紧跟竞对价格变化' },
  { value: 'reference', icon: '📊', label: '参考为主', desc: '参考竞对但保持独立判断' },
  { value: 'independent', icon: '🎯', label: '我行我素', desc: '以自身数据为主，少量参考' },
]

const priceChangeOptions = [5, 10, 15, 20]

const showStrategySummary = computed(() => {
  return currentStep.value === 3 && strategyProfile.riskPreference !== ''
})

const riskLabel = computed(() => {
  const map: Record<string, string> = { conservative: '保守稳健', balanced: '均衡', aggressive: '积极进取' }
  return map[strategyProfile.riskPreference] || '—'
})

const strategySummary = computed(() => {
  const risk = strategyProfile.riskPreference
  const comp = strategyProfile.competitorAttention

  let algorithmMode = '均衡模式'
  let revenueWeight = 50
  let occupancyWeight = 50
  let competitorFollow = 50

  if (risk === 'conservative') {
    algorithmMode = '稳健模式'
    occupancyWeight = 70
    revenueWeight = 30
  } else if (risk === 'aggressive') {
    algorithmMode = '收益优先'
    revenueWeight = 70
    occupancyWeight = 30
  }

  if (comp === 'follow') competitorFollow = 90
  else if (comp === 'reference') competitorFollow = 50
  else if (comp === 'independent') competitorFollow = 15

  return {
    algorithmMode,
    revenueWeight,
    occupancyWeight,
    maxChange: strategyProfile.maxPriceChange,
    competitorFollow,
  }
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

watch(() => currentStep.value, (newStep) => {
  if (newStep === 3 && !strategyProfile.riskPreference) {
    strategyProfile.riskPreference = 'balanced'
  }
})

async function handleSubmit() {
  submitting.value = true
  try {
    await http.put('/v1/config/strategy-profile', {
      riskPreference: strategyProfile.riskPreference,
      targetOccupancy: strategyProfile.targetOccupancy,
      competitorAttention: strategyProfile.competitorAttention,
      maxPriceChange: strategyProfile.maxPriceChange,
      algorithmMode: strategySummary.value.algorithmMode,
      revenueWeight: strategySummary.value.revenueWeight,
      occupancyWeight: strategySummary.value.occupancyWeight,
      competitorFollow: strategySummary.value.competitorFollow,
    })
    router.push('/dashboard')
  } catch {
    toastMessage.value = '策略配置保存失败，请稍后重试'
    toastVisible.value = true
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

.step-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.card-select-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.card-select {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.card-select:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.card-select--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.card-select__icon {
  font-size: 28px;
}

.card-select__title {
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.card-select__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  line-height: 1.4;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border);
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-value {
  font-weight: 700;
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  min-width: 50px;
  text-align: right;
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-xs);
}

.radio-group {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.radio-label input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.strategy-summary-card {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 100%);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.strategy-summary-card h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
  color: var(--color-primary);
}

.strategy-summary__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.strategy-summary__item {
  text-align: center;
}

.strategy-summary__label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-xs);
}

.strategy-summary__value {
  font-weight: 700;
  font-size: var(--font-size-lg);
  color: var(--color-text);
}

@media (max-width: 640px) {
  .card-select-group {
    grid-template-columns: 1fr;
  }

  .strategy-summary__grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
