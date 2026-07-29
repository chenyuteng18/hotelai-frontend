<template>
  <div class="calendar-page">
    <div class="calendar-toolbar">
      <div class="calendar-toolbar__nav">
        <button class="btn calendar-nav" aria-label="上个月" @click="prevMonth">← 上月</button>
        <h1 class="calendar-toolbar__title">{{ currentMonthLabel }}</h1>
        <button class="btn calendar-nav" aria-label="下个月" @click="nextMonth">下月 →</button>
        <button class="btn btn-primary calendar-today-btn" @click="goToday">今天</button>
      </div>

      <div class="calendar-toolbar__right">
        <div class="freshness" :class="{ 'freshness--stale': isDataStale }" role="status">
          <span class="freshness__dot" aria-hidden="true"></span>
          <span class="freshness__text">数据更新于 {{ freshTimeLabel }}</span>
          <span v-if="isDataStale" class="freshness__warning">数据已超 4 小时未更新</span>
        </div>
        <div class="calendar-legend" aria-hidden="true">
          <span class="legend-item"><i class="legend-swatch legend-swatch--green"></i>达标</span>
          <span class="legend-item"><i class="legend-swatch legend-swatch--yellow"></i>预警</span>
          <span class="legend-item"><i class="legend-swatch legend-swatch--red"></i>未达标</span>
          <span class="legend-item"><i class="legend-swatch legend-swatch--gray"></i>暂无数据</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="skeleton-grid" aria-hidden="true">
      <div v-for="n in 42" :key="n" class="skeleton-card"></div>
    </div>

    <div v-else class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="calendar-weekday">{{ day }}</div>
      <template v-for="(cell, i) in calendarCells" :key="i">
        <div v-if="cell.type !== 'current'" class="calendar-cell calendar-cell--other">
          <span class="day-other">{{ cell.day }}</span>
        </div>
        <div v-else class="calendar-cell">
          <button
            type="button"
            class="day-card"
            :class="[
              'day-card--' + dayStatus(cell.data),
              {
                'day-card--today': cell.isToday,
                'day-card--weekend': cell.isWeekend,
                'day-card--selected': selectedDay === cell.day,
                'day-card--flash': cell.isToday && flashToday,
              },
            ]"
            :aria-expanded="selectedDay === cell.day"
            :aria-label="`${currentMonthLabel}${cell.day}日 ${statusLabel(cell.data)}`"
            @click="toggleDayDetail(cell)"
          >
            <span class="day-card__status-bar" aria-hidden="true"></span>
            <span class="day-card__header">
              <span class="day-card__date">{{ cell.day }}</span>
              <span class="day-card__weekday">{{ cell.weekday }}</span>
              <span v-if="cell.isToday" class="day-card__today-badge">今天</span>
            </span>

            <template v-if="hasDayData(cell.data)">
              <span class="day-card__metrics">
                <span class="metric-row">
                  <span class="metric-label">入住率</span>
                  <span class="metric-value">{{ cell.data!.occupancy ?? '--' }}%</span>
                </span>
                <span class="metric-row">
                  <span class="metric-label">ADR</span>
                  <span class="metric-value">
                    {{ formatCurrency(cell.data!.adr) }}
                    <span v-if="cell.data!.adrChange != null" :class="changeClass(cell.data!.adrChange)">
                      {{ cell.data!.adrChange >= 0 ? '↑' : '↓' }}{{ Math.abs(cell.data!.adrChange) }}%
                    </span>
                  </span>
                </span>
                <span class="metric-row">
                  <span class="metric-label">RevPAR</span>
                  <span class="metric-value">{{ formatCurrency(cell.data!.revpar) }}</span>
                </span>
                <span
                  class="progress-bar"
                  role="img"
                  :aria-label="'入住率 ' + occupancyPercent(cell.data) + '%'"
                >
                  <span
                    class="progress-bar__fill"
                    :class="'progress-bar__fill--' + dayStatus(cell.data)"
                    :style="{ width: occupancyPercent(cell.data) + '%' }"
                  ></span>
                </span>
                <span class="metric-row day-card__footer">
                  <span class="metric-label">收入 {{ formatCurrency(cell.data!.revenue) }}</span>
                  <span class="metric-label">置信度 {{ confidenceLabel(cell.data!.confidence) }}</span>
                </span>
              </span>
            </template>
            <span v-else class="day-card__empty">暂无数据</span>
          </button>
        </div>
      </template>
    </div>

    <transition name="panel">
      <section
        v-if="selectedDay != null && !loading"
        class="detail-panel"
        :aria-label="`${selectedDateLabel} 定价详情`"
      >
        <header class="detail-panel__header">
          <h3 class="detail-panel__date">{{ selectedDateLabel }}</h3>
          <span v-if="selectedHasData && selectedCell?.data" class="detail-panel__summary">
            入住率 {{ selectedCell.data.occupancy ?? '--' }}% · ADR {{ formatCurrency(selectedCell.data.adr) }} ·
            RevPAR {{ formatCurrency(selectedCell.data.revpar) }} · 收入 {{ formatCurrency(selectedCell.data.revenue) }}
          </span>
          <span v-else class="detail-panel__no-data">该日无定价记录</span>
        </header>

        <div class="detail-panel__columns">
          <template v-if="selectedHasData">
            <div class="detail-panel__col">
              <h4 class="detail-panel__col-title">竞对价格</h4>
              <ul v-if="dayDetail?.competitors?.length" class="detail-panel__list">
                <li v-for="comp in dayDetail.competitors" :key="comp.name" class="competitor-row">
                  <span class="competitor-row__name">{{ comp.name }}</span>
                  <span class="competitor-row__price">{{ formatCurrency(comp.price) }}</span>
                </li>
              </ul>
              <div v-else class="detail-panel__empty">暂无数据</div>
            </div>

            <div class="detail-panel__col">
              <h4 class="detail-panel__col-title">AI 建议价</h4>
              <div v-if="dayDetail?.suggestions?.length" class="ai-suggestions">
                <div v-for="sug in dayDetail.suggestions" :key="sug.roomType" class="ai-card">
                  <span class="ai-card__room">{{ sug.roomType }}</span>
                  <span class="ai-card__price">{{ formatCurrency(sug.price) }}</span>
                  <span v-if="sug.confidence != null" class="ai-card__confidence">
                    <span class="ai-card__confidence-label">置信度</span>
                    <span class="ai-card__confidence-bar">
                      <span class="ai-card__confidence-fill" :style="{ width: sug.confidence + '%' }"></span>
                    </span>
                    <span class="ai-card__confidence-value">{{ sug.confidence }}%</span>
                  </span>
                </div>
              </div>
              <div v-else class="detail-panel__empty">暂无数据</div>
            </div>

            <div class="detail-panel__col">
              <h4 class="detail-panel__col-title">执行记录</h4>
              <ol v-if="dayDetail?.executions?.length" class="execution-timeline">
                <li v-for="(exec, idx) in dayDetail.executions" :key="idx" class="execution-timeline__item">
                  <span
                    class="execution-timeline__dot"
                    :class="exec.status === 'success' ? 'execution-timeline__dot--ok' : 'execution-timeline__dot--fail'"
                    aria-hidden="true"
                  ></span>
                  <span class="execution-timeline__time">{{ exec.time }}</span>
                  <span class="execution-timeline__action">{{ exec.action }}</span>
                  <span class="execution-timeline__result" :class="'execution-timeline__result--' + exec.status">
                    {{ exec.statusLabel }}
                  </span>
                </li>
              </ol>
              <div v-else class="detail-panel__empty">暂无数据</div>
            </div>
          </template>
          <div v-else class="detail-panel__full-empty">该日无定价记录</div>
        </div>
      </section>
    </transition>

    <div v-if="!loading && !calendarCells.some((c) => c.type === 'current' && hasDayData(c.data))" class="empty-state">
      <p>暂无日历数据</p>
      <p class="empty-state__hint">请切换月份或稍后刷新</p>
      <button class="btn btn-primary" style="margin-top: var(--spacing-md)" @click="fetchCalendarData">刷新数据</button>
    </div>

    <AppToast
      :show="toastVisible"
      :message="toastMessage"
      type="error"
      :retryable="true"
      @update:show="toastVisible = $event"
      @retry="fetchCalendarData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import axios from 'axios'
import AppToast from '../../components/common/AppToast.vue'
import { formatCurrency } from '../../utils/format'

interface CalendarDay {
  date: string
  day: number
  weekday: string
  occupancy: number | null
  adr: number | null
  adrChange: number | null
  revpar: number | null
  revenue: number | null
  confidence: string | null
}

interface DayDetail {
  competitors: { name: string; price: number }[]
  suggestions: { roomType: string; price: number; confidence: number | null }[]
  executions: { time: string; action: string; status: string; statusLabel: string }[]
}

interface ForecastRow {
  target_date: string
  predicted_occ: number | null
  predicted_adr: number | null
  predicted_revpar: number | null
  confidence: string | null
}

interface TrendRow {
  date: string
  my_price: number | null
  comp_avg: number | null
}

interface SuggestionItem {
  room_type_name: string
  target_date: string
  target_price: number | null
  confidence: string | number | null
}

interface ApprovalItem {
  room_type_name: string
  target_date: string
  target_price: string | number | null
  status: string
  approved_at: string | null
}

interface SummaryData {
  today_suggestions: SuggestionItem[]
  recent_approvals: ApprovalItem[]
  competitor_comparison: {
    my_avg_price: number
    competitor_avg_price: number
    trend_7d: TrendRow[]
  }
}

type CellType = 'prev' | 'current' | 'next'

interface CalendarCell {
  type: CellType
  day: number
  weekday?: string
  isWeekend: boolean
  isToday: boolean
  data?: CalendarDay | null
}

const calHttp = axios.create({
  baseURL: import.meta.env.VITE_CALENDAR_API_BASE_URL || 'http://118.190.207.62:3002/api/v1',
  timeout: 15000,
})

calHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const STALE_HOURS = 4
const ROOM_COUNT = 49
const OCC_GREEN = 75
const OCC_YELLOW = 55

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const calendarData = ref<CalendarDay[]>([])
const summary = ref<SummaryData | null>(null)
const loading = ref(false)
const dataLastUpdated = ref('')
const selectedDay = ref<number | null>(null)
const flashToday = ref(false)
const pendingTodayFlash = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')

const weekDays = ['一', '二', '三', '四', '五', '六', '日']
const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const currentMonthLabel = computed(() => `${currentYear.value}年${currentMonth.value}月`)

function isWeekendDate(date: Date): boolean {
  const d = date.getDay()
  return d === 0 || d === 6
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function toLocalDateStr(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toPercent(occ: number | null | undefined): number | null {
  if (occ == null) return null
  return occ <= 1 ? Math.round(occ * 100) : Math.round(occ)
}

function confidenceNum(c: string | number | null | undefined): number | null {
  if (c == null) return null
  if (typeof c === 'number') return c <= 1 ? Math.round(c * 100) : Math.round(c)
  const map: Record<string, number> = { high: 90, medium: 70, low: 50 }
  return map[String(c).toLowerCase()] ?? null
}

function confidenceLabel(c: string | null | undefined): string {
  if (!c) return '--'
  const map: Record<string, string> = { high: '高', medium: '中', low: '低' }
  return map[String(c).toLowerCase()] ?? String(c)
}

const calendarCells = computed<CalendarCell[]>(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate()
  const today = new Date()

  let startWeekday = firstDay.getDay()
  if (startWeekday === 0) startWeekday = 7
  startWeekday -= 1

  const cells: CalendarCell[] = []

  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const date = new Date(year, month - 2, d)
    cells.push({ type: 'prev', day: d, isWeekend: isWeekendDate(date), isToday: isSameDate(date, today) })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const existing = calendarData.value.find((c) => c.date === dateStr) || null
    cells.push({
      type: 'current',
      day: d,
      weekday: weekdayNames[date.getDay()],
      isWeekend: isWeekendDate(date),
      isToday: isSameDate(date, today),
      data: existing,
    })
  }

  let nextDay = 1
  while (cells.length < 42) {
    const date = new Date(year, month, nextDay)
    cells.push({ type: 'next', day: nextDay, isWeekend: isWeekendDate(date), isToday: isSameDate(date, today) })
    nextDay++
  }

  return cells
})

const selectedCell = computed<CalendarCell | null>(() => {
  if (selectedDay.value == null) return null
  return calendarCells.value.find((c) => c.type === 'current' && c.day === selectedDay.value) || null
})

const selectedHasData = computed(() => hasDayData(selectedCell.value?.data ?? null))

const selectedDateLabel = computed(() => {
  if (!selectedCell.value) return ''
  return `${currentMonthLabel.value}${selectedCell.value.day}日 ${selectedCell.value.weekday}`
})

const freshTimeLabel = computed(() => {
  if (!dataLastUpdated.value) return '--:--'
  const d = new Date(dataLastUpdated.value)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const isDataStale = computed(() => {
  if (!dataLastUpdated.value) return false
  return Date.now() - new Date(dataLastUpdated.value).getTime() > STALE_HOURS * 60 * 60 * 1000
})

function hasDayData(data: CalendarDay | null | undefined): boolean {
  if (!data) return false
  return data.occupancy != null || data.adr != null || data.revpar != null
}

function occupancyPercent(data: CalendarDay | null | undefined): number {
  if (!data || data.occupancy == null) return 0
  return Math.min(100, Math.max(0, data.occupancy))
}

function dayStatus(data: CalendarDay | null | undefined): 'green' | 'yellow' | 'red' | 'gray' {
  if (!hasDayData(data)) return 'gray'
  const occ = data!.occupancy ?? 0
  if (occ >= OCC_GREEN) return 'green'
  if (occ >= OCC_YELLOW) return 'yellow'
  return 'red'
}

function statusLabel(data: CalendarDay | null | undefined): string {
  const s = dayStatus(data)
  if (s === 'green') return '达标'
  if (s === 'yellow') return '预警'
  if (s === 'red') return '未达标'
  return '暂无数据'
}

function changeClass(change: number): string {
  if (change > 0) return 'change-positive'
  if (change < 0) return 'change-negative'
  return 'change-neutral'
}

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

function toggleDayDetail(cell: CalendarCell) {
  if (cell.type !== 'current') return
  if (selectedDay.value === cell.day) {
    selectedDay.value = null
    return
  }
  selectedDay.value = cell.day
}

function flashTodayCard() {
  nextTick(() => {
    const el = document.querySelector('.day-card--today')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      flashToday.value = true
      setTimeout(() => {
        flashToday.value = false
      }, 600)
    }
  })
}

function goToday() {
  const today = new Date()
  const targetYear = today.getFullYear()
  const targetMonth = today.getMonth() + 1
  if (currentYear.value !== targetYear || currentMonth.value !== targetMonth) {
    pendingTodayFlash.value = true
    currentYear.value = targetYear
    currentMonth.value = targetMonth
  } else {
    flashTodayCard()
  }
}

function dateStrForDay(day: number): string {
  return `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const dayDetail = computed<DayDetail | null>(() => {
  if (selectedDay.value == null || !selectedCell.value) return null
  const dateStr = dateStrForDay(selectedDay.value)
  const detail: DayDetail = { competitors: [], suggestions: [], executions: [] }
  const s = summary.value
  if (!s) return detail

  const trend = (s.competitor_comparison?.trend_7d || []).find((t) => toLocalDateStr(t.date) === dateStr)
  if (trend) {
    if (trend.comp_avg != null) detail.competitors.push({ name: '竞对均价', price: trend.comp_avg })
    if (trend.my_price != null) detail.competitors.push({ name: '本店价', price: trend.my_price })
  }

  detail.suggestions = (s.today_suggestions || [])
    .filter((it) => toLocalDateStr(it.target_date) === dateStr)
    .map((it) => ({
      roomType: it.room_type_name,
      price: it.target_price != null ? Number(it.target_price) : 0,
      confidence: confidenceNum(it.confidence),
    }))

  detail.executions = (s.recent_approvals || [])
    .filter((a) => toLocalDateStr(a.target_date) === dateStr)
    .map((a) => {
      const t = a.approved_at ? new Date(a.approved_at) : null
      return {
        time: t ? `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` : '--:--',
        action: `${a.room_type_name} 调价至 ${formatCurrency(Number(a.target_price))}`,
        status: a.status === 'approved' ? 'success' : 'failed',
        statusLabel: a.status === 'approved' ? '已批准' : a.status === 'rejected' ? '已驳回' : '待审批',
      }
    })

  return detail
})

async function fetchSummary() {
  try {
    const { data } = await calHttp.get('/dashboard/summary')
    summary.value = data.data || data
  } catch {
    summary.value = null
  }
}

async function fetchCalendarData() {
  loading.value = true
  try {
    const { data } = await calHttp.get('/forecasts')
    const payload = data.data || data
    const rows: ForecastRow[] = payload.forecasts || []

    const sorted = [...rows].sort(
      (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    )

    calendarData.value = sorted.map((r, idx) => {
      const local = toLocalDateStr(r.target_date)
      const d = new Date(local + 'T00:00:00')
      const adr = r.predicted_adr != null ? Number(r.predicted_adr) : null
      const revpar = r.predicted_revpar != null ? Number(r.predicted_revpar) : null

      let adrChange: number | null = null
      if (idx > 0 && adr != null) {
        const prev = sorted[idx - 1].predicted_adr != null ? Number(sorted[idx - 1].predicted_adr) : null
        if (prev != null && prev !== 0) {
          adrChange = Math.round(((adr - prev) / prev) * 1000) / 10
        }
      }

      return {
        date: local,
        day: d.getDate(),
        weekday: weekdayNames[d.getDay()],
        occupancy: toPercent(r.predicted_occ),
        adr,
        adrChange,
        revpar,
        revenue: revpar != null ? Math.round(revpar * ROOM_COUNT) : null,
        confidence: r.confidence != null ? String(r.confidence) : null,
      }
    })

    dataLastUpdated.value = payload.generated_at
      ? new Date(payload.generated_at).toISOString()
      : new Date().toISOString()
  } catch {
    calendarData.value = []
    toastMessage.value = '日历数据加载失败，请检查网络后重试'
    toastVisible.value = true
  } finally {
    loading.value = false
  }
}

watch([currentYear, currentMonth], () => {
  selectedDay.value = null
})

watch(loading, (val) => {
  if (!val && pendingTodayFlash.value) {
    pendingTodayFlash.value = false
    flashTodayCard()
  }
})

onMounted(() => {
  fetchCalendarData()
  fetchSummary()
})
</script>

<style scoped>
.calendar-page {
  min-height: 100%;
}

/* ===== Toolbar ===== */
.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.calendar-toolbar__nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.calendar-toolbar__title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  min-width: 110px;
  text-align: center;
}

.calendar-nav {
  padding: 6px 14px;
  font-size: var(--font-size-sm);
}

.calendar-today-btn {
  padding: 6px 16px;
  font-size: var(--font-size-sm);
}

.calendar-toolbar__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.freshness {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.freshness__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse-dot 2s infinite;
}

.freshness--stale {
  color: var(--color-warning);
}

.freshness--stale .freshness__dot {
  background: var(--color-warning);
}

.freshness__warning {
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  color: var(--color-warning);
  padding: 1px 8px;
  border-radius: var(--radius-sm);
  font-weight: 500;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.calendar-legend {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}

.legend-swatch--green {
  background: var(--color-success);
}

.legend-swatch--yellow {
  background: var(--color-warning);
}

.legend-swatch--red {
  background: var(--color-error);
}

.legend-swatch--gray {
  background: var(--color-border);
}

/* ===== Skeleton ===== */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-sm);
}

.skeleton-card {
  min-height: 160px;
  border-radius: var(--radius-md);
  background: linear-gradient(110deg, #eceff4 30%, #f8fafc 50%, #eceff4 70%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ===== Calendar Grid ===== */
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
  min-height: 160px;
}

.calendar-cell--other {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: var(--spacing-sm);
}

.day-other {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

/* ===== Day Card ===== */
.day-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  height: 100%;
  min-height: 160px;
  padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) 14px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: inherit;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.day-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.day-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.day-card--weekend {
  background: var(--color-bg);
}

.day-card--today {
  border-color: var(--color-primary);
  border-width: 2px;
  box-shadow: 0 0 0 3px var(--color-primary-bg);
}

.day-card--selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-bg), var(--shadow-md);
}

.day-card--flash {
  animation: today-flash 0.6s ease;
}

@keyframes today-flash {
  0%,
  100% {
    box-shadow: 0 0 0 3px var(--color-primary-bg);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(22, 119, 255, 0.25), 0 0 24px rgba(22, 119, 255, 0.4);
  }
}

.day-card__status-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.day-card--green .day-card__status-bar {
  background: var(--color-success);
}

.day-card--yellow .day-card__status-bar {
  background: var(--color-warning);
}

.day-card--red .day-card__status-bar {
  background: var(--color-error);
}

.day-card--gray .day-card__status-bar {
  background: var(--color-border);
}

.day-card__header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.day-card__date {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.day-card__weekday {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.day-card__today-badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  background: var(--color-primary);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.day-card__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.day-card__metrics {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 4px;
}

.metric-label {
  color: var(--color-text-secondary);
  font-size: 11px;
  white-space: nowrap;
}

.metric-value {
  font-weight: 600;
  font-size: var(--font-size-xs);
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
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

.progress-bar {
  display: block;
  height: 4px;
  background: #eef1f6;
  border-radius: 2px;
  overflow: hidden;
  margin: 2px 0;
}

.progress-bar__fill {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}

.progress-bar__fill--green {
  background: var(--color-success);
}

.progress-bar__fill--yellow {
  background: var(--color-warning);
}

.progress-bar__fill--red {
  background: var(--color-error);
}

.progress-bar__fill--gray {
  background: var(--color-border);
}

.day-card__footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border);
  padding-top: 4px;
}

/* ===== Detail Panel ===== */
.detail-panel {
  margin-top: var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-md) var(--spacing-lg);
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.detail-panel__header {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  flex-wrap: wrap;
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-md);
}

.detail-panel__date {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.detail-panel__summary {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.detail-panel__no-data {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.detail-panel__columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-lg);
}

.detail-panel__col-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  padding-bottom: 6px;
  border-bottom: 2px solid var(--color-primary-bg);
  margin-bottom: var(--spacing-sm);
}

.detail-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  background: var(--color-bg);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.detail-panel__full-empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-base);
  background: var(--color-bg);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.detail-panel__list {
  list-style: none;
}

.competitor-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-bg);
  font-size: var(--font-size-sm);
}

.competitor-row:last-child {
  border-bottom: none;
}

.competitor-row__name {
  color: var(--color-text-secondary);
}

.competitor-row__price {
  font-weight: 600;
}

.ai-suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ai-card__room {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.ai-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.ai-card__price {
  font-size: var(--font-size-xxl);
  font-weight: 700;
  color: var(--color-primary-active);
}

.ai-card__confidence {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.ai-card__confidence-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.ai-card__confidence-bar {
  flex: 1;
  height: 6px;
  background: #d6e4ff;
  border-radius: 3px;
  overflow: hidden;
}

.ai-card__confidence-fill {
  display: block;
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
}

.ai-card__confidence-value {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary-active);
}

.execution-timeline {
  list-style: none;
  position: relative;
  padding-left: var(--spacing-md);
}

.execution-timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--color-border);
  border-radius: 1px;
}

.execution-timeline__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px 0;
  font-size: var(--font-size-xs);
}

.execution-timeline__dot {
  position: absolute;
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid var(--color-bg-card);
}

.execution-timeline__dot--ok {
  background: var(--color-success);
}

.execution-timeline__dot--fail {
  background: var(--color-error);
}

.execution-timeline__time {
  color: var(--color-text-tertiary);
  min-width: 40px;
}

.execution-timeline__action {
  flex: 1;
}

.execution-timeline__result {
  font-weight: 500;
}

.execution-timeline__result--success {
  color: var(--color-success);
}

.execution-timeline__result--failed {
  color: var(--color-error);
}

.execution-timeline__result--pending {
  color: var(--color-warning);
}

/* ===== Empty State ===== */
.empty-state {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-tertiary);
}

.empty-state__hint {
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xs);
}

/* ===== Responsive ===== */
@media (max-width: 1200px) {
  .calendar-grid,
  .skeleton-grid {
    gap: 6px;
  }

  .calendar-cell,
  .day-card,
  .skeleton-card {
    min-height: 140px;
  }
}

@media (max-width: 900px) {
  .detail-panel__columns {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .calendar-cell,
  .day-card,
  .skeleton-card {
    min-height: 120px;
  }

  .day-card__footer {
    display: none;
  }
}

@media (max-width: 600px) {
  .calendar-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .calendar-legend {
    display: none;
  }

  .calendar-cell,
  .day-card,
  .skeleton-card {
    min-height: 90px;
  }

  .day-card__weekday {
    display: none;
  }

  .progress-bar {
    display: none;
  }

  .detail-panel {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .detail-panel__header {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
