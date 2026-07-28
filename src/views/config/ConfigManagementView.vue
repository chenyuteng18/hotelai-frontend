<template>
  <div class="config-page">
    <div class="page-header">
      <h1>配置管理</h1>
      <p>系统参数、集成配置与业务规则</p>
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

    <!-- 定价策略 -->
    <div v-if="activeTab === 'pricing'" class="card config-content">
      <div class="config-section">
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
      <div class="config-actions">
        <button class="btn btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
        <button class="btn" @click="handleReset">重置默认</button>
      </div>
      <p v-if="saved" class="save-success" role="status">配置已保存</p>
    </div>

    <!-- 通知设置 -->
    <div v-if="activeTab === 'notification'" class="card config-content">
      <div class="config-section">
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
      <div class="config-actions">
        <button class="btn btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
      <p v-if="saved" class="save-success" role="status">配置已保存</p>
    </div>

    <!-- 审批规则 -->
    <div v-if="activeTab === 'approval'" class="card config-content">
      <div class="config-section">
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
      <div class="config-actions">
        <button class="btn btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
      <p v-if="saved" class="save-success" role="status">配置已保存</p>
    </div>

    <!-- 系统参数 -->
    <div v-if="activeTab === 'system'" class="card config-content">
      <div class="config-section">
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
      </div>
      <p v-if="saved" class="save-success" role="status">配置已保存</p>
    </div>

    <!-- OTA 账号池 -->
    <div v-if="activeTab === 'ota_accounts'" class="config-content config-content--wide">
      <div class="sub-header">
        <div>
          <h2>OTA 账号池</h2>
          <p class="sub-header__desc">管理携程、美团、飞猪等 OTA 平台的账号连接</p>
        </div>
        <button class="btn btn-primary" @click="showOtaForm = true">+ 新增账号</button>
      </div>
      <div v-if="showOtaForm" class="card inline-form">
        <h3>{{ editingOta ? '编辑账号' : '新增 OTA 账号' }}</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="otaPlatform">平台</label>
            <select id="otaPlatform" v-model="otaForm.platform" class="form-input">
              <option value="">请选择</option>
              <option value="ctrip">携程</option>
              <option value="meituan">美团</option>
              <option value="fliggy">飞猪</option>
              <option value="qunar">去哪儿</option>
              <option value="booking">Booking</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="otaAccount">账号名称</label>
            <input id="otaAccount" v-model="otaForm.accountName" class="form-input" placeholder="例：旗舰店-01" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="otaUser">用户名 / 手机号</label>
            <input id="otaUser" v-model="otaForm.username" class="form-input" placeholder="登录账号" />
          </div>
          <div class="form-group">
            <label class="form-label" for="otaPass">密码 / Token</label>
            <input id="otaPass" v-model="otaForm.password" type="password" class="form-input" placeholder="••••••••" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="otaForm.enabled" />
            启用自动同步
          </label>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveOtaAccount">保存</button>
          <button class="btn" @click="cancelOtaForm">取消</button>
        </div>
      </div>
      <div class="card">
        <table class="data-table" v-if="otaAccounts.length">
          <thead>
            <tr>
              <th>平台</th>
              <th>账号名称</th>
              <th>用户名</th>
              <th>状态</th>
              <th>最后同步</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="acc in paginatedOta" :key="acc.id">
              <td><span class="platform-badge" :class="'platform-badge--' + acc.platform">{{ platformLabel(acc.platform) }}</span></td>
              <td>{{ acc.accountName }}</td>
              <td>{{ acc.username }}</td>
              <td>
                <span class="status-tag" :class="acc.enabled ? 'status-tag--success' : 'status-tag--warning'">
                  {{ acc.enabled ? '已启用' : '已停用' }}
                </span>
              </td>
              <td>{{ acc.lastSync || '—' }}</td>
              <td class="table-actions">
                <button class="btn-link" @click="editOtaAccount(acc)">编辑</button>
                <button class="btn-link btn-link--danger" @click="confirmDeleteOta(acc)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <p>暂无 OTA 账号</p>
          <p class="empty-state__hint">点击「新增账号」添加第一个 OTA 平台连接</p>
        </div>
        <div v-if="otaTotalPages > 1" class="pagination">
          <button class="btn btn-sm" :disabled="otaPage <= 1" @click="otaPage--">上一页</button>
          <span class="pagination__info">{{ otaPage }} / {{ otaTotalPages }}</span>
          <button class="btn btn-sm" :disabled="otaPage >= otaTotalPages" @click="otaPage++">下一页</button>
        </div>
      </div>
      <div v-if="confirmAction" class="modal-overlay" @click.self="confirmAction = null">
        <div class="modal-card card" role="alertdialog" aria-label="确认操作">
          <h3>{{ confirmAction.title }}</h3>
          <p>{{ confirmAction.message }}</p>
          <div class="form-actions">
            <button class="btn btn-danger" @click="confirmAction.onConfirm">确认</button>
            <button class="btn" @click="confirmAction = null">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 采集计划 -->
    <div v-if="activeTab === 'collection'" class="config-content config-content--wide">
      <div class="sub-header">
        <div>
          <h2>采集计划</h2>
          <p class="sub-header__desc">配置竞品价格和房态数据的自动采集频率与范围</p>
        </div>
        <button class="btn btn-primary" @click="showCollectionForm = true">+ 新增计划</button>
      </div>
      <div v-if="showCollectionForm" class="card inline-form">
        <h3>{{ editingCollection ? '编辑计划' : '新增采集计划' }}</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="collName">计划名称</label>
            <input id="collName" v-model="collectionForm.name" class="form-input" placeholder="例：每日竞品价格采集" />
          </div>
          <div class="form-group">
            <label class="form-label" for="collPlatform">目标平台</label>
            <select id="collPlatform" v-model="collectionForm.platform" class="form-input">
              <option value="">请选择</option>
              <option value="ctrip">携程</option>
              <option value="meituan">美团</option>
              <option value="fliggy">飞猪</option>
              <option value="all">全部平台</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="collFreq">采集频率</label>
            <select id="collFreq" v-model="collectionForm.frequency" class="form-input">
              <option value="hourly">每小时</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="collTime">执行时间</label>
            <input id="collTime" v-model="collectionForm.executeTime" type="time" class="form-input" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="collectionForm.includeOccupancy" />
            同时采集入住率数据
          </label>
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="collectionForm.enabled" />
            启用计划
          </label>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveCollectionPlan">保存</button>
          <button class="btn" @click="cancelCollectionForm">取消</button>
        </div>
      </div>
      <div class="card">
        <table class="data-table" v-if="collectionPlans.length">
          <thead>
            <tr>
              <th>计划名称</th>
              <th>平台</th>
              <th>频率</th>
              <th>执行时间</th>
              <th>状态</th>
              <th>上次执行</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="plan in paginatedCollection" :key="plan.id">
              <td>{{ plan.name }}</td>
              <td><span class="platform-badge" :class="'platform-badge--' + plan.platform">{{ platformLabel(plan.platform) }}</span></td>
              <td>{{ freqLabel(plan.frequency) }}</td>
              <td>{{ plan.executeTime }}</td>
              <td>
                <span class="status-tag" :class="plan.enabled ? 'status-tag--success' : 'status-tag--warning'">
                  {{ plan.enabled ? '运行中' : '已暂停' }}
                </span>
              </td>
              <td>{{ plan.lastRun || '—' }}</td>
              <td class="table-actions">
                <button class="btn-link" @click="editCollectionPlan(plan)">编辑</button>
                <button class="btn-link" @click="runCollectionNow(plan)">立即执行</button>
                <button class="btn-link btn-link--danger" @click="confirmDeleteCollection(plan)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <p>暂无采集计划</p>
          <p class="empty-state__hint">创建采集计划以自动获取竞品数据</p>
        </div>
        <div v-if="collectionTotalPages > 1" class="pagination">
          <button class="btn btn-sm" :disabled="collectionPage <= 1" @click="collectionPage--">上一页</button>
          <span class="pagination__info">{{ collectionPage }} / {{ collectionTotalPages }}</span>
          <button class="btn btn-sm" :disabled="collectionPage >= collectionTotalPages" @click="collectionPage++">下一页</button>
        </div>
      </div>
    </div>

    <!-- PMS 导入配置 -->
    <div v-if="activeTab === 'pms_import'" class="config-content config-content--wide">
      <div class="sub-header">
        <div>
          <h2>PMS 导入配置</h2>
          <p class="sub-header__desc">配置 PMS 系统数据导入规则与字段映射</p>
        </div>
      </div>
      <div class="card config-section">
        <h3>导入设置</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="pmsType">PMS 系统类型</label>
            <select id="pmsType" v-model="pmsConfig.systemType" class="form-input">
              <option value="">请选择</option>
              <option value="opera">Oracle OPERA</option>
              <option value="cloudbeds">Cloudbeds</option>
              <option value="greencloud">绿云</option>
              <option value="zhuzhe">住哲</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="pmsApiUrl">API 地址</label>
            <input id="pmsApiUrl" v-model="pmsConfig.apiUrl" class="form-input" placeholder="https://your-pms.com/api" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="pmsApiKey">API Key</label>
            <input id="pmsApiKey" v-model="pmsConfig.apiKey" type="password" class="form-input" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label class="form-label" for="pmsSyncFreq">同步频率</label>
            <select id="pmsSyncFreq" v-model="pmsConfig.syncFrequency" class="form-input">
              <option value="realtime">实时</option>
              <option value="hourly">每小时</option>
              <option value="daily">每天</option>
              <option value="manual">手动</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" v-model="pmsConfig.autoImport" />
            启用自动导入
          </label>
        </div>
      </div>
      <div class="card config-section">
        <h3>字段映射</h3>
        <p class="section-desc">将 PMS 字段映射到系统字段</p>
        <table class="data-table">
          <thead>
            <tr>
              <th>系统字段</th>
              <th>PMS 字段</th>
              <th>类型</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mapping in pmsConfig.fieldMappings" :key="mapping.systemField">
              <td>{{ mapping.systemFieldLabel }}</td>
              <td>
                <input v-model="mapping.pmsField" class="form-input form-input--sm" :placeholder="'PMS 中的字段名'" />
              </td>
              <td><span class="type-badge">{{ mapping.type }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card config-section">
        <h3>导入日志</h3>
        <table class="data-table" v-if="pmsImportLogs.length">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>记录数</th>
              <th>状态</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in pmsImportLogs" :key="log.id">
              <td>{{ log.time }}</td>
              <td>{{ log.type }}</td>
              <td>{{ log.records }}</td>
              <td>
                <span class="status-tag" :class="log.status === 'success' ? 'status-tag--success' : 'status-tag--error'">
                  {{ log.status === 'success' ? '成功' : '失败' }}
                </span>
              </td>
              <td>{{ log.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <p>暂无导入记录</p>
          <p class="empty-state__hint">配置完成后，导入日志将在此显示</p>
        </div>
      </div>
      <div class="config-actions">
        <button class="btn btn-primary" :disabled="saving" @click="handleSave">保存配置</button>
        <button class="btn" @click="testPmsConnection">测试连接</button>
      </div>
      <p v-if="saved" class="save-success" role="status">配置已保存</p>
      <p v-if="pmsTestResult" class="pms-test-result" :class="'pms-test-result--' + pmsTestResult.status" role="status">
        {{ pmsTestResult.message }}
      </p>
    </div>

    <!-- 通知审批 -->
    <div v-if="activeTab === 'notify_approval'" class="config-content config-content--wide">
      <div class="sub-header">
        <div>
          <h2>通知审批</h2>
          <p class="sub-header__desc">配置需要审批的通知类型与审批流程</p>
        </div>
      </div>
      <div class="card config-section">
        <h3>审批通知规则</h3>
        <div v-for="rule in notifyApprovalRules" :key="rule.id" class="notify-rule">
          <div class="notify-rule__header">
            <label class="form-label notify-rule__toggle">
              <input type="checkbox" v-model="rule.enabled" />
              {{ rule.label }}
            </label>
            <span class="status-tag" :class="rule.enabled ? 'status-tag--success' : 'status-tag--warning'">
              {{ rule.enabled ? '已启用' : '已停用' }}
            </span>
          </div>
          <div class="notify-rule__body">
            <div class="form-group">
              <label class="form-label" :for="'notify-channel-' + rule.id">通知渠道</label>
              <div class="checkbox-group">
                <label v-for="ch in notifyChannels" :key="ch.value">
                  <input type="checkbox" :value="ch.value" v-model="rule.channels" />
                  {{ ch.label }}
                </label>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" :for="'notify-level-' + rule.id">审批级别</label>
                <select :id="'notify-level-' + rule.id" v-model="rule.approvalLevel" class="form-input">
                  <option value="auto">自动审批</option>
                  <option value="manager">经理审批</option>
                  <option value="director">总监审批</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" :for="'notify-timeout-' + rule.id">超时处理</label>
                <select :id="'notify-timeout-' + rule.id" v-model="rule.timeoutAction" class="form-input">
                  <option value="remind">提醒审批人</option>
                  <option value="escalate">自动升级</option>
                  <option value="auto_approve">自动通过</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card config-section">
        <h3>审批人配置</h3>
        <table class="data-table" v-if="approvers.length">
          <thead>
            <tr>
              <th>姓名</th>
              <th>角色</th>
              <th>审批范围</th>
              <th>通知方式</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="approver in approvers" :key="approver.id">
              <td>{{ approver.name }}</td>
              <td>{{ approver.role }}</td>
              <td>{{ approver.scope }}</td>
              <td>{{ approver.notifyMethod }}</td>
              <td class="table-actions">
                <button class="btn-link" @click="editApprover(approver)">编辑</button>
                <button class="btn-link btn-link--danger" @click="removeApprover(approver)">移除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <p>暂无审批人</p>
          <p class="empty-state__hint">添加审批人以启用审批流程</p>
        </div>
        <button class="btn" @click="addApprover" style="margin-top: var(--spacing-md)">+ 添加审批人</button>
      </div>
      <div class="config-actions">
        <button class="btn btn-primary" :disabled="saving" @click="handleSave">保存配置</button>
      </div>
      <p v-if="saved" class="save-success" role="status">配置已保存</p>
    </div>

    <!-- 策略画像 -->
    <div v-if="activeTab === 'strategy_profile'" class="config-content config-content--wide">
      <div class="sub-header">
        <div>
          <h2>策略画像</h2>
          <p class="sub-header__desc">可视化当前定价策略参数，支持手动微调</p>
        </div>
      </div>

      <div v-if="strategyLoading" class="loading-state">加载策略配置中...</div>

      <template v-else>
        <!-- 雷达图可视化 -->
        <div class="card config-section">
          <h3>策略参数雷达图</h3>
          <div class="radar-chart">
            <svg viewBox="0 0 300 300" class="radar-svg">
              <!-- Background circles -->
              <circle cx="150" cy="150" r="100" fill="none" stroke="var(--color-border)" stroke-width="1" opacity="0.3" />
              <circle cx="150" cy="150" r="75" fill="none" stroke="var(--color-border)" stroke-width="1" opacity="0.3" />
              <circle cx="150" cy="150" r="50" fill="none" stroke="var(--color-border)" stroke-width="1" opacity="0.3" />
              <circle cx="150" cy="150" r="25" fill="none" stroke="var(--color-border)" stroke-width="1" opacity="0.3" />
              <!-- Axis lines -->
              <line v-for="(axis, i) in radarAxes" :key="'line-' + i"
                x1="150" y1="150"
                :x2="150 + 100 * Math.cos(axis.angle)"
                :y2="150 + 100 * Math.sin(axis.angle)"
                stroke="var(--color-border)" stroke-width="1" opacity="0.3" />
              <!-- Data polygon -->
              <polygon
                :points="radarPoints"
                fill="var(--color-primary)" fill-opacity="0.2"
                stroke="var(--color-primary)" stroke-width="2" />
              <!-- Data points -->
              <circle v-for="(point, i) in radarDataPoints" :key="'point-' + i"
                :cx="point.x" :cy="point.y" r="4"
                fill="var(--color-primary)" />
              <!-- Labels -->
              <text v-for="(axis, i) in radarAxes" :key="'label-' + i"
                :x="150 + 115 * Math.cos(axis.angle)"
                :y="150 + 115 * Math.sin(axis.angle)"
                text-anchor="middle" dominant-baseline="middle"
                class="radar-label">{{ axis.label }}</text>
            </svg>
          </div>
        </div>

        <!-- 参数调整 -->
        <div class="card config-section">
          <h3>参数调整</h3>

          <div class="param-row">
            <label class="param-label">风险偏好</label>
            <div class="param-control">
              <select v-model="editedProfile.riskPreference" class="form-input">
                <option value="conservative">保守稳健</option>
                <option value="balanced">均衡</option>
                <option value="aggressive">积极进取</option>
              </select>
            </div>
            <div v-if="editedProfile.riskPreference !== currentProfile.riskPreference" class="param-change">
              {{ riskLabel(currentProfile.riskPreference) }} → {{ riskLabel(editedProfile.riskPreference) }}
            </div>
          </div>

          <div class="param-row">
            <label class="param-label">目标入住率</label>
            <div class="param-control">
              <input type="range" v-model.number="editedProfile.targetOccupancy" min="50" max="95" step="5" class="slider" />
              <span class="slider-value">{{ editedProfile.targetOccupancy }}%</span>
            </div>
            <div v-if="editedProfile.targetOccupancy !== currentProfile.targetOccupancy" class="param-change">
              {{ currentProfile.targetOccupancy }}% → {{ editedProfile.targetOccupancy }}%
            </div>
          </div>

          <div class="param-row">
            <label class="param-label">竞对关注度</label>
            <div class="param-control">
              <select v-model="editedProfile.competitorAttention" class="form-input">
                <option value="follow">完全跟随</option>
                <option value="reference">参考为主</option>
                <option value="independent">我行我素</option>
              </select>
            </div>
            <div v-if="editedProfile.competitorAttention !== currentProfile.competitorAttention" class="param-change">
              {{ compLabel(currentProfile.competitorAttention) }} → {{ compLabel(editedProfile.competitorAttention) }}
            </div>
          </div>

          <div class="param-row">
            <label class="param-label">单次调价幅度上限</label>
            <div class="param-control">
              <select v-model.number="editedProfile.maxPriceChange" class="form-input">
                <option :value="5">5%</option>
                <option :value="10">10%</option>
                <option :value="15">15%</option>
                <option :value="20">20%</option>
              </select>
            </div>
            <div v-if="editedProfile.maxPriceChange !== currentProfile.maxPriceChange" class="param-change">
              {{ currentProfile.maxPriceChange }}% → {{ editedProfile.maxPriceChange }}%
            </div>
          </div>

          <div class="param-row">
            <label class="param-label">收益权重</label>
            <div class="param-control">
              <input type="range" v-model.number="editedProfile.revenueWeight" min="0" max="100" step="5" class="slider" />
              <span class="slider-value">{{ editedProfile.revenueWeight }}%</span>
            </div>
            <div v-if="editedProfile.revenueWeight !== currentProfile.revenueWeight" class="param-change">
              {{ currentProfile.revenueWeight }}% → {{ editedProfile.revenueWeight }}%
            </div>
          </div>

          <div class="param-row">
            <label class="param-label">竞对跟随度</label>
            <div class="param-control">
              <input type="range" v-model.number="editedProfile.competitorFollow" min="0" max="100" step="5" class="slider" />
              <span class="slider-value">{{ editedProfile.competitorFollow }}%</span>
            </div>
            <div v-if="editedProfile.competitorFollow !== currentProfile.competitorFollow" class="param-change">
              {{ currentProfile.competitorFollow }}% → {{ editedProfile.competitorFollow }}%
            </div>
          </div>
        </div>

        <!-- 变更对比 -->
        <div v-if="hasChanges" class="card config-section change-summary">
          <h3>变更对比</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>参数</th>
                <th>当前值</th>
                <th>新值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="change in changeList" :key="change.key">
                <td>{{ change.label }}</td>
                <td class="change-old">{{ change.oldValue }}</td>
                <td class="change-new">{{ change.newValue }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="config-actions">
          <button class="btn btn-primary" :disabled="saving || !hasChanges" @click="saveStrategyProfile">
            {{ saving ? '保存中...' : '保存策略' }}
          </button>
          <button class="btn" :disabled="!hasChanges" @click="resetEdits">重置</button>
        </div>
        <p v-if="saved" class="save-success" role="status">策略已保存</p>
        <p class="strategy-note">修改后立即对下次定价生效</p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { http } from '../../services/api'

const activeTab = ref('pricing')
const saving = ref(false)
const saved = ref(false)

const tabs = [
  { id: 'pricing', label: '定价策略' },
  { id: 'notification', label: '通知设置' },
  { id: 'approval', label: '审批规则' },
  { id: 'system', label: '系统参数' },
  { id: 'ota_accounts', label: 'OTA 账号池' },
  { id: 'collection', label: '采集计划' },
  { id: 'pms_import', label: 'PMS 导入' },
  { id: 'notify_approval', label: '通知审批' },
  { id: 'strategy_profile', label: '策略画像' },
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

// --- OTA 账号池 ---
interface OtaAccount {
  id: number
  platform: string
  accountName: string
  username: string
  enabled: boolean
  lastSync: string
}

const otaAccounts = ref<OtaAccount[]>([
  { id: 1, platform: 'ctrip', accountName: '旗舰店-01', username: 'hotel_flagship', enabled: true, lastSync: '2026-07-27 08:30' },
  { id: 2, platform: 'meituan', accountName: '美团直营店', username: 'meituan_direct', enabled: true, lastSync: '2026-07-27 07:00' },
  { id: 3, platform: 'fliggy', accountName: '飞猪旅行店', username: 'fliggy_travel', enabled: false, lastSync: '' },
])
const showOtaForm = ref(false)
const editingOta = ref<OtaAccount | null>(null)
const otaForm = reactive({ platform: '', accountName: '', username: '', password: '', enabled: true })
const otaPage = ref(1)
const OTA_PER_PAGE = 10

const otaTotalPages = computed(() => Math.ceil(otaAccounts.value.length / OTA_PER_PAGE))
const paginatedOta = computed(() => {
  const start = (otaPage.value - 1) * OTA_PER_PAGE
  return otaAccounts.value.slice(start, start + OTA_PER_PAGE)
})

function saveOtaAccount() {
  if (editingOta.value) {
    Object.assign(editingOta.value, { platform: otaForm.platform, accountName: otaForm.accountName, username: otaForm.username, enabled: otaForm.enabled })
  } else {
    otaAccounts.value.push({
      id: Date.now(),
      platform: otaForm.platform,
      accountName: otaForm.accountName,
      username: otaForm.username,
      enabled: otaForm.enabled,
      lastSync: '',
    })
  }
  cancelOtaForm()
}

function editOtaAccount(acc: OtaAccount) {
  editingOta.value = acc
  Object.assign(otaForm, { platform: acc.platform, accountName: acc.accountName, username: acc.username, password: '', enabled: acc.enabled })
  showOtaForm.value = true
}

function cancelOtaForm() {
  showOtaForm.value = false
  editingOta.value = null
  Object.assign(otaForm, { platform: '', accountName: '', username: '', password: '', enabled: true })
}

// --- 采集计划 ---
interface CollectionPlan {
  id: number
  name: string
  platform: string
  frequency: string
  executeTime: string
  enabled: boolean
  includeOccupancy: boolean
  lastRun: string
}

const collectionPlans = ref<CollectionPlan[]>([
  { id: 1, name: '每日竞品价格采集', platform: 'all', frequency: 'daily', executeTime: '06:00', enabled: true, includeOccupancy: true, lastRun: '2026-07-27 06:00' },
  { id: 2, name: '携程实时价格', platform: 'ctrip', frequency: 'hourly', executeTime: '00:00', enabled: true, includeOccupancy: false, lastRun: '2026-07-27 10:00' },
])
const showCollectionForm = ref(false)
const editingCollection = ref<CollectionPlan | null>(null)
const collectionForm = reactive({ name: '', platform: '', frequency: 'daily', executeTime: '06:00', enabled: true, includeOccupancy: false })
const collectionPage = ref(1)
const COLL_PER_PAGE = 10

const collectionTotalPages = computed(() => Math.ceil(collectionPlans.value.length / COLL_PER_PAGE))
const paginatedCollection = computed(() => {
  const start = (collectionPage.value - 1) * COLL_PER_PAGE
  return collectionPlans.value.slice(start, start + COLL_PER_PAGE)
})

function saveCollectionPlan() {
  if (editingCollection.value) {
    Object.assign(editingCollection.value, { ...collectionForm })
  } else {
    collectionPlans.value.push({ id: Date.now(), ...collectionForm, lastRun: '' })
  }
  cancelCollectionForm()
}

function editCollectionPlan(plan: CollectionPlan) {
  editingCollection.value = plan
  Object.assign(collectionForm, { name: plan.name, platform: plan.platform, frequency: plan.frequency, executeTime: plan.executeTime, enabled: plan.enabled, includeOccupancy: plan.includeOccupancy })
  showCollectionForm.value = true
}

function cancelCollectionForm() {
  showCollectionForm.value = false
  editingCollection.value = null
  Object.assign(collectionForm, { name: '', platform: '', frequency: 'daily', executeTime: '06:00', enabled: true, includeOccupancy: false })
}

function runCollectionNow(plan: CollectionPlan) {
  plan.lastRun = new Date().toLocaleString('zh-CN')
}

// --- PMS 导入 ---
const pmsConfig = reactive({
  systemType: '',
  apiUrl: '',
  apiKey: '',
  syncFrequency: 'hourly',
  autoImport: false,
  fieldMappings: [
    { systemField: 'roomNumber', systemFieldLabel: '房间号', pmsField: 'rm_no', type: 'string' },
    { systemField: 'roomType', systemFieldLabel: '房型', pmsField: 'rm_type', type: 'string' },
    { systemField: 'price', systemFieldLabel: '房价', pmsField: 'rate', type: 'number' },
    { systemField: 'occupancy', systemFieldLabel: '入住状态', pmsField: 'occ_status', type: 'string' },
    { systemField: 'guestName', systemFieldLabel: '宾客姓名', pmsField: 'guest_name', type: 'string' },
    { systemField: 'checkIn', systemFieldLabel: '入住日期', pmsField: 'check_in_dt', type: 'date' },
    { systemField: 'checkOut', systemFieldLabel: '退房日期', pmsField: 'check_out_dt', type: 'date' },
  ],
})

const pmsImportLogs = ref([
  { id: 1, time: '2026-07-27 06:00', type: '自动同步', records: 128, status: 'success', note: '' },
  { id: 2, time: '2026-07-26 18:00', type: '手动导入', records: 0, status: 'failed', note: '连接超时' },
])

const pmsTestResult = ref<{ status: string; message: string } | null>(null)

function testPmsConnection() {
  pmsTestResult.value = { status: 'testing', message: '正在测试连接...' }
  setTimeout(() => {
    if (pmsConfig.apiUrl && pmsConfig.apiKey) {
      pmsTestResult.value = { status: 'success', message: '连接成功！PMS 系统响应正常' }
    } else {
      pmsTestResult.value = { status: 'error', message: '连接失败：请填写 API 地址和密钥' }
    }
  }, 1500)
}

// --- 通知审批 ---
interface NotifyRule {
  id: string
  label: string
  enabled: boolean
  channels: string[]
  approvalLevel: string
  timeoutAction: string
}

const notifyApprovalRules = ref<NotifyRule[]>([
  { id: 'price_change', label: '价格调整通知', enabled: true, channels: ['email', 'sms'], approvalLevel: 'manager', timeoutAction: 'remind' },
  { id: 'inventory_release', label: '库存释放通知', enabled: true, channels: ['email'], approvalLevel: 'auto', timeoutAction: 'auto_approve' },
  { id: 'promotion', label: '促销活动通知', enabled: false, channels: ['email', 'sms', 'wechat'], approvalLevel: 'director', timeoutAction: 'escalate' },
])

const notifyChannels = [
  { label: '邮件', value: 'email' },
  { label: '短信', value: 'sms' },
  { label: '企业微信', value: 'wechat' },
  { label: '钉钉', value: 'dingtalk' },
]

interface Approver {
  id: number
  name: string
  role: string
  scope: string
  notifyMethod: string
}

const approvers = ref<Approver[]>([
  { id: 1, name: '张经理', role: '收益经理', scope: '价格调整 ≤ ¥5000', notifyMethod: '邮件 + 短信' },
  { id: 2, name: '李总监', role: '运营总监', scope: '促销活动', notifyMethod: '邮件 + 企业微信' },
])

function addApprover() {
  approvers.value.push({ id: Date.now(), name: '新审批人', role: '待分配', scope: '全部', notifyMethod: '邮件' })
}

function editApprover(_approver: Approver) {
  // 可扩展为弹窗编辑
}

function removeApprover(approver: Approver) {
  approvers.value = approvers.value.filter((a) => a.id !== approver.id)
}

// --- 确认弹窗 ---
interface ConfirmAction {
  title: string
  message: string
  onConfirm: () => void
}

const confirmAction = ref<ConfirmAction | null>(null)

function confirmDeleteOta(acc: OtaAccount) {
  confirmAction.value = {
    title: '删除 OTA 账号',
    message: `确认删除「${acc.accountName}」？删除后将停止该平台的数据同步。`,
    onConfirm: () => {
      otaAccounts.value = otaAccounts.value.filter((a) => a.id !== acc.id)
      confirmAction.value = null
    },
  }
}

function confirmDeleteCollection(plan: CollectionPlan) {
  confirmAction.value = {
    title: '删除采集计划',
    message: `确认删除「${plan.name}」？删除后将不再自动采集该平台数据。`,
    onConfirm: () => {
      collectionPlans.value = collectionPlans.value.filter((p) => p.id !== plan.id)
      confirmAction.value = null
    },
  }
}

// --- 工具函数 ---
function platformLabel(p: string) {
  const map: Record<string, string> = { ctrip: '携程', meituan: '美团', fliggy: '飞猪', qunar: '去哪儿', booking: 'Booking', all: '全部' }
  return map[p] || p
}

function freqLabel(f: string) {
  const map: Record<string, string> = { hourly: '每小时', daily: '每天', weekly: '每周' }
  return map[f] || f
}

// --- 策略画像 ---
interface StrategyProfile {
  riskPreference: string
  targetOccupancy: number
  competitorAttention: string
  maxPriceChange: number
  revenueWeight: number
  occupancyWeight: number
  competitorFollow: number
}

const strategyLoading = ref(false)
const currentProfile = reactive<StrategyProfile>({
  riskPreference: 'balanced',
  targetOccupancy: 80,
  competitorAttention: 'reference',
  maxPriceChange: 10,
  revenueWeight: 50,
  occupancyWeight: 50,
  competitorFollow: 50,
})

const editedProfile = reactive<StrategyProfile>({ ...currentProfile })

function riskLabel(v: string) {
  const map: Record<string, string> = { conservative: '保守稳健', balanced: '均衡', aggressive: '积极进取' }
  return map[v] || v
}

function compLabel(v: string) {
  const map: Record<string, string> = { follow: '完全跟随', reference: '参考为主', independent: '我行我素' }
  return map[v] || v
}

const radarAxes = [
  { label: '收益权重', angle: -Math.PI / 2 },
  { label: '入住率权重', angle: -Math.PI / 2 + (2 * Math.PI / 5) },
  { label: '竞对跟随', angle: -Math.PI / 2 + (4 * Math.PI / 5) },
  { label: '调幅容忍', angle: -Math.PI / 2 + (6 * Math.PI / 5) },
  { label: '目标入住', angle: -Math.PI / 2 + (8 * Math.PI / 5) },
]

const radarDataPoints = computed(() => {
  const values = [
    editedProfile.revenueWeight / 100,
    editedProfile.occupancyWeight / 100,
    editedProfile.competitorFollow / 100,
    editedProfile.maxPriceChange / 20,
    editedProfile.targetOccupancy / 100,
  ]
  return radarAxes.map((axis, i) => ({
    x: 150 + 100 * values[i] * Math.cos(axis.angle),
    y: 150 + 100 * values[i] * Math.sin(axis.angle),
  }))
})

const radarPoints = computed(() => radarDataPoints.value.map((p) => `${p.x},${p.y}`).join(' '))

const hasChanges = computed(() => {
  return (Object.keys(currentProfile) as (keyof StrategyProfile)[]).some(
    (k) => editedProfile[k] !== currentProfile[k]
  )
})

const changeList = computed(() => {
  const items: { key: string; label: string; oldValue: string; newValue: string }[] = []
  if (editedProfile.riskPreference !== currentProfile.riskPreference) {
    items.push({ key: 'risk', label: '风险偏好', oldValue: riskLabel(currentProfile.riskPreference), newValue: riskLabel(editedProfile.riskPreference) })
  }
  if (editedProfile.targetOccupancy !== currentProfile.targetOccupancy) {
    items.push({ key: 'occupancy', label: '目标入住率', oldValue: currentProfile.targetOccupancy + '%', newValue: editedProfile.targetOccupancy + '%' })
  }
  if (editedProfile.competitorAttention !== currentProfile.competitorAttention) {
    items.push({ key: 'comp', label: '竞对关注度', oldValue: compLabel(currentProfile.competitorAttention), newValue: compLabel(editedProfile.competitorAttention) })
  }
  if (editedProfile.maxPriceChange !== currentProfile.maxPriceChange) {
    items.push({ key: 'change', label: '调价幅度上限', oldValue: currentProfile.maxPriceChange + '%', newValue: editedProfile.maxPriceChange + '%' })
  }
  if (editedProfile.revenueWeight !== currentProfile.revenueWeight) {
    items.push({ key: 'revWeight', label: '收益权重', oldValue: currentProfile.revenueWeight + '%', newValue: editedProfile.revenueWeight + '%' })
  }
  if (editedProfile.competitorFollow !== currentProfile.competitorFollow) {
    items.push({ key: 'compFollow', label: '竞对跟随度', oldValue: currentProfile.competitorFollow + '%', newValue: editedProfile.competitorFollow + '%' })
  }
  return items
})

function resetEdits() {
  Object.assign(editedProfile, { ...currentProfile })
}

async function fetchStrategyProfile() {
  strategyLoading.value = true
  try {
    const { data } = await http.get('/v1/config/strategy-profile')
    const d = data.data || data
    Object.assign(currentProfile, {
      riskPreference: d.riskPreference || 'balanced',
      targetOccupancy: d.targetOccupancy || 80,
      competitorAttention: d.competitorAttention || 'reference',
      maxPriceChange: d.maxPriceChange || 10,
      revenueWeight: d.revenueWeight || 50,
      occupancyWeight: d.occupancyWeight || 50,
      competitorFollow: d.competitorFollow || 50,
    })
    Object.assign(editedProfile, { ...currentProfile })
  } catch {
    // API 不可用时使用默认值
  } finally {
    strategyLoading.value = false
  }
}

async function saveStrategyProfile() {
  saving.value = true
  saved.value = false
  try {
    await http.put('/v1/config/strategy-profile', { ...editedProfile })
    Object.assign(currentProfile, { ...editedProfile })
    saved.value = true
  } catch {
    // 保存失败
  } finally {
    saving.value = false
  }
}

watch(() => activeTab.value, (val) => {
  if (val === 'strategy_profile') {
    fetchStrategyProfile()
  }
})

onMounted(() => {
  if (activeTab.value === 'strategy_profile') {
    fetchStrategyProfile()
  }
})
</script>

<style scoped>
.config-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.config-tab {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: none;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
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

.config-content--wide {
  max-width: 100%;
}

.config-section h2,
.config-section h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--spacing-xs);
}

.section-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-md);
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

/* Sub-header */
.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.sub-header h2 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.sub-header__desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

/* Data tables */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.data-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.table-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  padding: 2px 4px;
  cursor: pointer;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-link--danger {
  color: var(--color-error);
}

/* Platform badges */
.platform-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.platform-badge--ctrip { background: #e6f0ff; color: #2563eb; }
.platform-badge--meituan { background: #fff7e6; color: #d97706; }
.platform-badge--fliggy { background: #fce7f3; color: #db2777; }
.platform-badge--qunar { background: #ecfdf5; color: #059669; }
.platform-badge--booking { background: #eff6ff; color: #1d4ed8; }
.platform-badge--all { background: #f3f4f6; color: #374151; }

/* Type badges */
.type-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

/* Inline form */
.inline-form {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-lg);
}

.inline-form h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.form-input--sm {
  padding: 4px 8px;
  font-size: var(--font-size-xs);
}

.form-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
}

.pagination__info {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.btn-sm {
  padding: 4px 12px;
  font-size: var(--font-size-xs);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-card {
  max-width: 400px;
  width: 90%;
  padding: var(--spacing-lg);
}

.modal-card h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.modal-card p {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

/* Notify rules */
.notify-rule {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  overflow: hidden;
}

.notify-rule__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.notify-rule__toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 500;
  font-size: var(--font-size-sm);
  margin: 0;
}

.notify-rule__body {
  padding: var(--spacing-md);
}

.checkbox-group {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* PMS test result */
.pms-test-result {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.pms-test-result--success {
  color: var(--color-success);
  background: #f0fdf4;
}

.pms-test-result--error {
  color: var(--color-error);
  background: #fef2f2;
}

.pms-test-result--testing {
  color: var(--color-text-secondary);
  background: var(--color-bg);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-lg);
  color: var(--color-text-tertiary);
}

.empty-state__hint {
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xs);
}

/* Danger button */
.btn-danger {
  background: var(--color-error);
  color: #fff;
  border: none;
}

.btn-danger:hover {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .sub-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .data-table {
    font-size: var(--font-size-xs);
  }

  .data-table th,
  .data-table td {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
}

/* 策略画像 */
.radar-chart {
  display: flex;
  justify-content: center;
  padding: var(--spacing-md) 0;
}

.radar-svg {
  width: 300px;
  height: 300px;
  max-width: 100%;
}

.radar-label {
  font-size: 11px;
  fill: var(--color-text-secondary);
  font-weight: 500;
}

.param-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);
}

.param-row:last-child {
  border-bottom: none;
}

.param-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text);
}

.param-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.param-control .slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border);
  border-radius: 3px;
  outline: none;
}

.param-control .slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.param-control .slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: none;
}

.param-control .slider-value {
  font-weight: 700;
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  min-width: 45px;
  text-align: right;
}

.param-change {
  font-size: var(--font-size-xs);
  color: var(--color-warning);
  font-weight: 500;
  white-space: nowrap;
  background: #fffbeb;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid #fde68a;
}

.change-summary {
  border: 2px solid var(--color-primary);
  background: var(--color-primary-bg);
}

.change-old {
  color: var(--color-text-tertiary);
  text-decoration: line-through;
}

.change-new {
  color: var(--color-primary);
  font-weight: 600;
}

.strategy-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-primary);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .param-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }

  .param-change {
    justify-self: start;
  }
}
</style>
