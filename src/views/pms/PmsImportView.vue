<template>
  <div class="pms-page">
    <div class="page-header">
      <h1>PMS 数据导入</h1>
      <p>从 Excel 文件导入 PMS 历史数据</p>
    </div>

    <div class="pms-grid">
      <div class="card upload-section">
        <h2>上传数据文件</h2>
        <div
          class="drop-zone"
          :class="{ 'drop-zone--active': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="drop-zone__content">
            <span class="drop-zone__icon" aria-hidden="true">📄</span>
            <p>拖拽 Excel 文件到此处，或</p>
            <label class="btn btn-primary" for="fileInput">
              {{ uploading ? '上传中...' : '选择文件' }}
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              class="drop-zone__input"
              :disabled="uploading"
              @change="handleFileSelect"
            />
            <p class="drop-zone__hint">支持 .xlsx / .xls / .csv，最大 10MB</p>
          </div>
        </div>
        <div class="upload-actions">
          <button class="btn" :disabled="downloading" @click="downloadTemplate">
            {{ downloading ? '下载中...' : '下载导入模板' }}
          </button>
        </div>
        <p v-if="uploadError" class="error-text" role="alert">{{ uploadError }}</p>
      </div>

      <div v-if="previewData.length" class="card preview-section">
        <div class="preview-header">
          <h2>预览解析结果</h2>
          <span class="preview-count">共 {{ previewData.length }} 行</span>
        </div>
        <div class="table-wrapper">
          <table class="preview-table">
            <thead>
              <tr>
                <th v-for="col in previewColumns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in paginatedPreview" :key="i">
                <td v-for="col in previewColumns" :key="col">{{ row[col] ?? '--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="previewData.length > pageSize" class="pagination">
          <button class="btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
          <span class="pagination__info">{{ currentPage }} / {{ totalPages }}</span>
          <button class="btn btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
        </div>
        <div class="preview-actions">
          <button class="btn" @click="cancelPreview">取消</button>
          <button class="btn btn-primary" :disabled="confirming" @click="confirmImport">
            {{ confirming ? '导入中...' : '确认导入' }}
          </button>
        </div>
      </div>
    </div>

    <div class="card records-section">
      <h2>最近导入记录</h2>
      <div v-if="!records.length" class="empty-state">
        <p>暂无导入记录</p>
        <p class="empty-hint">上传 Excel 文件开始导入 PMS 数据</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="records-table">
          <thead>
            <tr>
              <th>导入时间</th>
              <th>文件名</th>
              <th>状态</th>
              <th>行数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records" :key="record.id">
              <td>{{ record.createdAt }}</td>
              <td>{{ record.fileName }}</td>
              <td>
                <span class="status-tag" :class="recordStatusClass(record.status)">
                  {{ recordStatusLabel(record.status) }}
                </span>
              </td>
              <td>{{ record.rowCount }}</td>
              <td>
                <button v-if="record.status === 'failed'" class="btn btn-sm" @click="retryImport(record)">
                  重试
                </button>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showConfirmDialog" class="modal-overlay" @click.self="showConfirmDialog = false">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
        <h3 id="confirmTitle">确认导入</h3>
        <p>确定要导入 {{ previewData.length }} 行数据吗？此操作将覆盖同日期已有数据。</p>
        <div class="modal-actions">
          <button class="btn" @click="showConfirmDialog = false">取消</button>
          <button class="btn btn-primary" @click="doConfirmImport">确认导入</button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast" :class="'toast--' + toast.type" role="alert">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://118.190.207.62:8080/api',
  timeout: 30000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface ImportRecord {
  id: number
  fileName: string
  status: 'success' | 'failed' | 'processing'
  rowCount: number
  createdAt: string
}

const isDragging = ref(false)
const uploading = ref(false)
const confirming = ref(false)
const downloading = ref(false)
const uploadError = ref('')
const previewData = ref<Record<string, unknown>[]>([])
const previewColumns = ref<string[]>([])
const currentPage = ref(1)
const pageSize = 50
const records = ref<ImportRecord[]>([])
const showConfirmDialog = ref(false)
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const totalPages = computed(() => Math.ceil(previewData.value.length / pageSize))
const paginatedPreview = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return previewData.value.slice(start, start + pageSize)
})

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => { toast.value = null }, 3000)
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) processFile(files[0])
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) processFile(input.files[0])
}

async function processFile(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = '文件大小不能超过 10MB'
    return
  }
  uploadError.value = ''
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await http.post('/v1/pms/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { preview: true },
    })
    previewData.value = data.data.rows || []
    previewColumns.value = data.data.columns || []
    currentPage.value = 1
  } catch {
    uploadError.value = '文件解析失败，请检查文件格式'
    showToast('error', '文件解析失败')
  } finally {
    uploading.value = false
  }
}

function cancelPreview() {
  previewData.value = []
  previewColumns.value = []
}

function confirmImport() {
  showConfirmDialog.value = true
}

async function doConfirmImport() {
  showConfirmDialog.value = false
  confirming.value = true
  try {
    await http.post('/v1/pms/import', { rows: previewData.value })
    showToast('success', `成功导入 ${previewData.value.length} 行数据`)
    previewData.value = []
    previewColumns.value = []
    fetchRecords()
  } catch {
    showToast('error', '导入失败，请重试')
  } finally {
    confirming.value = false
  }
}

async function downloadTemplate() {
  downloading.value = true
  try {
    const response = await http.get('/v1/pms/template', { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pms_import_template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    showToast('error', '模板下载失败')
  } finally {
    downloading.value = false
  }
}

async function fetchRecords() {
  try {
    const { data } = await http.get('/v1/pms/imports')
    records.value = data.data || []
  } catch {
    // silent
  }
}

function retryImport(_record: ImportRecord) {
  showToast('success', '正在重新导入...')
}

function recordStatusClass(status: string) {
  if (status === 'success') return 'status-tag--success'
  if (status === 'failed') return 'status-tag--error'
  return 'status-tag--warning'
}

function recordStatusLabel(status: string) {
  if (status === 'success') return '成功'
  if (status === 'failed') return '失败'
  return '处理中'
}

onMounted(fetchRecords)
</script>

<style scoped>
.pms-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.upload-section h2,
.preview-header h2,
.records-section h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  text-align: center;
  transition: all 0.2s;
}

.drop-zone--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.drop-zone__icon {
  font-size: 48px;
  display: block;
  margin-bottom: var(--spacing-md);
}

.drop-zone__input {
  display: none;
}

.drop-zone__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-sm);
}

.upload-actions {
  margin-top: var(--spacing-md);
}

.error-text {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: var(--spacing-md);
}

.preview-table,
.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.preview-table th,
.preview-table td,
.records-table th,
.records-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.preview-table th,
.records-table th {
  font-weight: 600;
  background: var(--color-bg);
}

.pagination {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.pagination__info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.btn-sm {
  padding: 4px 10px;
  font-size: var(--font-size-xs);
}

.preview-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
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

.text-muted {
  color: var(--color-text-tertiary);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  max-width: 400px;
  width: 90%;
}

.modal h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.modal p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

.toast {
  position: fixed;
  bottom: var(--spacing-xl);
  right: var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  box-shadow: var(--shadow-lg);
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

.toast--success {
  background: var(--color-success);
  color: #fff;
}

.toast--error {
  background: var(--color-error);
  color: #fff;
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
