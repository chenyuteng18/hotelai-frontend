<template>
  <div class="calendar-page">
    <div class="calendar-header">
      <div class="calendar-header__left">
        <h1>定价日历</h1>
        <p class="calendar-header__subtitle">月度运营数据概览</p>
      </div>
      <div class="calendar-header__right">
        <button class="btn calendar-nav" aria-label="上个月" @click="prevMonth">
          ← 上月
        </button>
        <span class="calendar-header__month">{{ currentMonthLabel }}</span>
        <button class="btn calendar-nav" aria-label="下个月" @click="nextMonth">
          下月 →
        </button>
      </div>
    </div>
    <DataFreshness :lastUpdated="dataLastUpdated" :staleThreshold="2" @refresh="fetchCalendarData" />
    <div class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="calendar-weekday">{{ day }}</div>
      <div
        v-for="(cell, i) in calendarCells"
        :key="i"
        class="calendar-cell"
        :class="{ 'calendar-cell--empty': !cell.day }"
      >
        <div v-if="cell.day" class="day-card" :class="dayCardClass(cell)">
          <div class="day-card__header">
            <span class="day-card__date">{{ cell.day }}日</span>
            <span class="day-card__weekday">{{ cell.weekday }}</span>
            <span class="day-card__status" :aria-label="statusLabel(cell)">{{ statusIcon(cell) }}</span>
          </div>
          <div class="day-card__meta">
            <span class="day-card__otb">OTB {{ cell.otbTime || '--:--' }}</span>
          </div>
          <div class="day-card__metrics">
            <div class="metric-row">
              <span class="metric-label">实际入住</span>
              <span class="metric-value">{{ cell.actualOccupancy ?? '--' }}%</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">预测入住</span>
              <span class="metric-value metric-value--predict">
                {{ cell.predictedOccupancy ?? '--' }}%
                <span v-if="cell.accuracy" class="accuracy">准确率{{ cell.accuracy }}%</span>
              </span>
            </div>
            <div class="metric-row">
              <span class="metric-label">ADR</span>
              <span class="metric-value">
                ¥{{ cell.adr ?? '--' }}
                <span v-if="cell.adrChange != null" :class="changeClass(cell.adrChange)">
                  ({{ cell.adrChange >= 0 ? '+' : '' }}{{ cell.adrChange }}%)
                </span>
              </span>
            </div>
            <div class="metric-row">
              <span class="metric-label">RevPAR</span>
              <span class="metric-value">
                ¥{{ cell.revpar ?? '--' }}
                <span v-if="cell.revparChange != null" :class="changeClass(cell.revparChange)">
                  ({{ cell.revparChange >= 0 ? '+' : '' }}{{ cell.revparChange }}%)
                </span>
              </span>
            </div>
          </div>
          <div class="day-card__revenue">
            <div class="revenue-row">
              <span class="revenue-label">Act.Rev</span>
              <span class="revenue-value">¥{{ formatMoney(cell.actualRevenue) }}</span>
            </div>
            <div class="revenue-row">
              <span class="revenue-label">Fct.Rev</span>
              <span class="revenue-value revenue-value--fct">¥{{ formatMoney(cell.forecastRevenue) }}</span>
            </div>
            <div class="progress-bar" role="img" :aria-label="'收入完成度 ' + completionPercent(cell) + '%'">
              <div
                class="progress-bar__fill"
                :class="completionClass(cell)"
                :style="{ width: completionPercent(cell) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-if="loading" class="loading-state">加载中...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import DataFreshness from '../../components/common/DataFreshness.vue'

interface CalendarDay {
  date: string
  day: number
  weekday: string
  otbTime: string | null
  actualOccupancy: number | null
  predictedOccupancy: number | null
  accuracy: number | null
  adr: number | null
  adrChange: number | null
  revpar: number | null
  revparChange: number | null
  actualRevenue: number | null
  forecastRevenue: number | null
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://118.190.207.62:8080/api',
  timeout: 15000,
})

type CalendarCell = {
  day: number | null
  weekday: string
  otbTime?: string | null
  actualOccupancy?: number | null
  predictedOccupancy?: number | null
  accuracy?: number | null
  adr?: number | null
  adrChange?: number | null
  revpar?: number | null
  revparChange?: number | null
  actualRevenue?: number | null
  forecastRevenue?: number | null
}

const currentYear = ref(2026)
const currentMonth = ref(7)
const calendarData = ref<CalendarDay[]>([])
const loading = ref(false)
const dataLastUpdated = ref('')

const weekDays = ['一', '二', '三', '四', '五', '六', '日']
const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const currentMonthLabel = computed(() => `${currentYear.value}年${currentMonth.value}月`)

const calendarCells = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  let startWeekday = firstDay.getDay()
  if (startWeekday === 0) startWeekday = 7
  startWeekday -= 1

  const cells: CalendarCell[] = []

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: null, weekday: '' })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const wd = weekdayNames[date.getDay()]
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const existing = calendarData.value.find((c) => c.date === dateStr)
    cells.push({
      day: d,
      weekday: wd,
      ...(existing || {
        otbTime: null,
        actualOccupancy: null,
        predictedOccupancy: null,
        accuracy: null,
        adr: null,
        adrChange: null,
        revpar: null,
        revparChange: null,
        actualRevenue: null,
        forecastRevenue: null,
      }),
    })
  }

  return cells
})

function prevMonth() {
  if (currentMonth.value === 1) {
    currentYear.value--
    currentMonth.value = 12
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentYear.value++
    currentMonth.value = 1
  } else {
    currentMonth.value++
  }
}

function formatMoney(val: number | null | undefined) {
  if (val == null) return '--'
  return val.toLocaleString()
}

function completionPercent(cell: CalendarCell) {
  if (!cell.forecastRevenue || !cell.actualRevenue) return 0
  return Math.min(100, Math.round((cell.actualRevenue / cell.forecastRevenue) * 100))
}

function completionClass(cell: CalendarCell) {
  const pct = completionPercent(cell)
  if (pct >= 90) return 'progress-bar__fill--safe'
  if (pct >= 60) return 'progress-bar__fill--warning'
  return 'progress-bar__fill--danger'
}

function changeClass(change: number) {
  if (change > 0) return 'change-positive'
  if (change < 0) return 'change-negative'
  return 'change-neutral'
}

function dayCardClass(cell: CalendarCell) {
  const pct = completionPercent(cell)
  if (pct >= 90) return 'day-card--success'
  if (pct >= 60) return 'day-card--warning'
  if (cell.actualRevenue != null) return 'day-card--danger'
  return ''
}

function statusIcon(cell: CalendarCell) {
  const pct = completionPercent(cell)
  if (pct >= 90) return '✅'
  if (pct >= 60) return '⚠️'
  if (cell.actualRevenue != null) return '❌'
  return '⏳'
}

function statusLabel(cell: CalendarCell) {
  const pct = completionPercent(cell)
  if (pct >= 90) return '达标'
  if (pct >= 60) return '预警'
  if (cell.actualRevenue != null) return '未达标'
  return '待更新'
}

async function fetchCalendarData() {
  loading.value = true
  try {
    const monthStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`
    const { data } = await http.get('/v1/calendar/monthly', { params: { month: monthStr } })
    calendarData.value = data.data || data
    dataLastUpdated.value = new Date().toLocaleString()
  } catch {
    calendarData.value = []
  } finally {
    loading.value = false
  }
}

watch([currentYear, currentMonth], fetchCalendarData)

onMounted(fetchCalendarData)
</script>

<style scoped>
.calendar-page {
  min-height: 100%;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.calendar-header h1 {
  font-size: var(--font-size-xxl);
  font-weight: 700;
}

.calendar-header__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.calendar-header__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.calendar-header__month {
  font-size: var(--font-size-lg);
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.calendar-nav {
  padding: 6px 14px;
  font-size: var(--font-size-sm);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-sm);
}

.calendar-weekday {
  text-align: center;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.calendar-cell {
  min-height: 180px;
}

.calendar-cell--empty {
  background: transparent;
}

.day-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: box-shadow 0.2s;
  font-size: var(--font-size-xs);
}

.day-card:hover {
  box-shadow: var(--shadow-md);
}

.day-card--success {
  border-left: 3px solid var(--color-success);
}

.day-card--warning {
  border-left: 3px solid var(--color-warning);
}

.day-card--danger {
  border-left: 3px solid var(--color-error);
}

.day-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.day-card__date {
  font-weight: 700;
  font-size: var(--font-size-sm);
}

.day-card__weekday {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.day-card__status {
  font-size: 14px;
}

.day-card__meta {
  color: var(--color-text-tertiary);
}

.day-card__metrics {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  color: var(--color-text-secondary);
}

.metric-value {
  font-weight: 600;
}

.metric-value--predict {
  color: var(--color-primary);
}

.accuracy {
  font-size: 10px;
  color: var(--color-success);
  font-weight: 400;
}

.change-positive {
  color: var(--color-success);
  font-size: 10px;
}

.change-negative {
  color: var(--color-error);
  font-size: 10px;
}

.change-neutral {
  color: var(--color-text-tertiary);
  font-size: 10px;
}

.day-card__revenue {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.revenue-row {
  display: flex;
  justify-content: space-between;
}

.revenue-label {
  color: var(--color-text-secondary);
}

.revenue-value {
  font-weight: 600;
}

.revenue-value--fct {
  color: var(--color-primary);
}

.loading-state {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: var(--spacing-xl);
}

@media (max-width: 1024px) {
  .calendar-grid {
    gap: 4px;
  }

  .day-card {
    padding: 4px;
    font-size: 10px;
  }

  .calendar-cell {
    min-height: 140px;
  }
}

@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }
}
</style>
