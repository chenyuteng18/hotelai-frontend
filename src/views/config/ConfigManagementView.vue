<template>
  <div class="config-page">
    <div class="page-header">
      <h1>配置管理</h1>
      <p>系统参数与业务规则配置</p>
    </div>
    <div class="config-tabs" role="tablist" aria-label="配置分类">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="config-tab"
        :class="{ 'config-tab--active': activeTab === tab.id }"
        role="tab"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="card config-content">
      <div v-if="activeTab === 'pricing'" class="config-section">
        <h2>定价策略</h2>
        <div class="form-group">
          <label class="form-label" for="priceFloor">最低价格限制（元）</label>
          <input id="priceFloor" v-model.number="config.priceFloor" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label" for="priceCeiling">最高价格限制（元）</label>
          <input id="priceCeiling" v-model.number="config.priceCeiling" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label" for="priceChangeLimit">单次调价幅度上限（%）</label>
          <input id="priceChangeLimit" v-model.number="config.priceChangeLimit" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="config.autoPricing" />
            启用 AI 自动定价
          </label>
        </div>
      </div>
      <div v-if="activeTab === 'notification'" class="config-section">
        <h2>通知设置</h2>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="config.emailNotify" />
            邮件通知
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" for="notifyEmail">通知邮箱</label>
          <input id="notifyEmail" v-model="config.notifyEmail" type="email" class="form-input" placeholder="接收通知的邮箱地址" />
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="config.lowOccupancyAlert" />
            入住率低于阈值时告警
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" for="occupancyThreshold">入住率告警阈值（%）</label>
          <input id="occupancyThreshold" v-model.number="config.occupancyThreshold" type="number" class="form-input" />
        </div>
      </div>
      <div v-if="activeTab === 'approval'" class="config-section">
        <h2>审批规则</h2>
        <div class="form-group">
          <label class="form-label" for="approvalThreshold">需审批的金额阈值（元）</label>
          <input id="approvalThreshold" v-model.number="config.approvalThreshold" type="number" class="form-input" />
          <p class="form-hint">超过此金额的调价/促销需上级审批</p>
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="config.autoApproveLow" />
            低于阈值自动通过
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" for="approvalTimeout">审批超时时间（小时）</label>
          <input id="approvalTimeout" v-model.number="config.approvalTimeout" type="number" class="form-input" />
        </div>
      </div>
      <div v-if="activeTab === 'system'" class="config-section">
        <h2>系统参数</h2>
        <div class="form-group">
          <label class="form-label" for="dataRetention">数据保留天数</label>
          <input id="dataRetention" v-model.number="config.dataRetention" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label" for="predictionHorizon">预测周期（天）</label>
          <input id="predictionHorizon" v-model.number="config.predictionHorizon" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="config.maintenanceMode" />
            维护模式（暂停 AI 建议推送）
          </label>
        </div>
      </div>
      <div class="config-actions">
        <button class="btn btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
        <button class="btn" @click="handleReset">重置默认</button>
      </div>
      <p v-if="saved" class="save-success" role="status">配置已保存</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'

const activeTab = ref('pricing')
const saving = ref(false)
const saved = ref(false)

const tabs = [
  { id: 'pricing', label: '定价策略' },
  { id: 'notification', label: '通知设置' },
  { id: 'approval', label: '审批规则' },
  { id: 'system', label: '系统参数' },
]

const config = reactive({
  priceFloor: 199,
  priceCeiling: 9999,
  priceChangeLimit: 20,
  autoPricing: false,
  emailNotify: true,
  notifyEmail: '',
  lowOccupancyAlert: true,
  occupancyThreshold: 60,
  approvalThreshold: 5000,
  autoApproveLow: true,
  approvalTimeout: 24,
  dataRetention: 365,
  predictionHorizon: 30,
  maintenanceMode: false,
})

async function handleSave() {
  saving.value = true
  saved.value = false
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    saved.value = true
  } finally {
    saving.value = false
  }
}

function handleReset() {
  config.priceFloor = 199
  config.priceCeiling = 9999
  config.priceChangeLimit = 20
  config.autoPricing = false
  config.emailNotify = true
  config.notifyEmail = ''
  config.lowOccupancyAlert = true
  config.occupancyThreshold = 60
  config.approvalThreshold = 5000
  config.autoApproveLow = true
  config.approvalTimeout = 24
  config.dataRetention = 365
  config.predictionHorizon = 30
  config.maintenanceMode = false
  saved.value = false
}
</script>

<style scoped>
.config-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.config-tab {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: none;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.config-tab:hover {
  color: var(--color-primary);
}

.config-tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.config-content {
  max-width: 600px;
}

.config-section h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-xs);
}

.config-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.save-success {
  color: var(--color-success);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-md);
}
</style>
