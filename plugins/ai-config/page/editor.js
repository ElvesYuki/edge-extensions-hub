import { store } from './store.js';
import {
  createDefaultConfig, createDefaultStep, createDefaultScorePoint,
  createDefaultScoreEvent, createDefaultAiEvent,
  formatConfigJson,
  sumStepScore, sumStepScoreCorrect,
  sumStepScorePoint, sumStepScorePointCorrect,
  sumStepScorePointEvent, sumStepScorePointEventCorrect,
  getAllAiEventCodes,
} from './model.js';
import {
  formatExportConfigJson, formatPlatformConfigJson,
  formatAiServerConfigJson, downloadJsonFile,
} from './export.js';
import { importJsonFile, importExcelFile } from './import.js';
import { validateConfig } from './validate.js';
import { renderTopForm } from './components/top-form.js';
import { renderStepRow } from './components/step-row.js';
import { renderScorePointRow } from './components/scorepoint-row.js';
import { renderScoreEventRow } from './components/scoreevent-row.js';
import { renderAiEventRow } from './components/aievent-row.js';
import { renderErrorEvents } from './components/error-events.js';

let configJson = null;
let topForm = null;
let errorEventsComp = null;
let validationPanel = null;
let statusBar = null;

function toast(message, type) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => { el.remove(); }, 3000);
}

function showEmptyState() {
  const root = document.getElementById('editor-root');
  root.innerHTML = '';
  validationPanel = null;
  statusBar = null;
  const tpl = document.getElementById('tpl-empty-state');
  const es = tpl.content.firstElementChild.cloneNode(true);
  es.querySelector('#btn-new-config').addEventListener('click', () => {
    configJson = createDefaultConfig();
    renderAll();
    markDirty('新配置尚未保存');
  });
  root.appendChild(es);
}

function renderAll() {
  const root = document.getElementById('editor-root');
  root.innerHTML = '';
  validationPanel = null;
  statusBar = null;

  if (!configJson) {
    showEmptyState();
    return;
  }

  // Top form
  topForm = renderTopForm(configJson, {
    onChange() {
      markDirty();
      refreshStats();
    },
    onSave() {
      saveConfig();
    },
    async onClear() {
      const confirmed = await confirmDialog({
        title: '清空配置',
        message: '确定清空当前配置？此操作会删除本地保存的数据。',
        confirmText: '清空配置',
      });
      if (!confirmed) return;
      store.clearConfig().then(() => {
        configJson = null;
        showEmptyState();
        toast('配置已清空', 'success');
      });
    },
    onRestoreBackup() {
      restoreBackupConfig();
    },
    onExportUpload() {
      exportConfig('上传版', formatExportConfigJson);
    },
    onExportPlatform() {
      exportConfig('平台-上传版', formatPlatformConfigJson);
    },
    onExportBox() {
      exportConfig('盒子版', formatAiServerConfigJson);
    },
    onPreview() {
      console.log('Config:', JSON.stringify(configJson, null, 2));
      toast('已输出到控制台', 'warning');
    },
    async onUploadExcel(file) {
      const err = await importExcelFile(file);
      if (err) { toast(err.error, 'error'); return; }
      const loaded = await store.loadConfig();
      if (loaded) {
        handleImportedConfig(loaded, 'Excel');
      } else {
        toast('Excel 导入失败', 'error');
      }
    },
    async onUploadJson(file) {
      const err = await importJsonFile(file);
      if (err) { toast(err.error, 'error'); return; }
      const loaded = await store.loadConfig();
      if (loaded) {
        handleImportedConfig(loaded, 'JSON');
      } else {
        toast('JSON 导入失败', 'error');
      }
    },
  });
  root.appendChild(topForm.root);
  topForm.syncToDOM();
  statusBar = createStatusBar();
  root.appendChild(statusBar);
  updateStatus('clean', '配置已加载');
  validationPanel = createValidationPanel();
  root.appendChild(validationPanel);

  // Steps section
  const stepsSection = document.createElement('div');
  stepsSection.className = 'steps-section';

  const stepsHeader = document.createElement('div');
  stepsHeader.className = 'steps-header';
  stepsHeader.innerHTML = '<h2>实验步骤：</h2>';
  const addStepBtn = document.createElement('button');
  addStepBtn.className = 'btn btn-success';
  addStepBtn.textContent = '添加步骤';
  addStepBtn.addEventListener('click', () => {
    const lastStep = configJson.steps[configJson.steps.length - 1];
    if (lastStep && lastStep.stepCode === 'ADD') {
      toast('请勿重复添加', 'warning');
      return;
    }
    configJson.steps.push(createDefaultStep(configJson.steps.length + 1));
    formatConfigJson(configJson);
    renderAll();
    markDirty();
  });
  stepsHeader.appendChild(addStepBtn);
  stepsSection.appendChild(stepsHeader);

  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'steps-container';

  configJson.steps.forEach((step, stepIndex) => {
    const stepComp = renderStepRow(step, stepIndex, configJson, {
      onChange() {
        markDirty();
        formatConfigJson(configJson);
        refreshStats();
      },
      onExpand(stepIdx) {
        // Accordion: close other steps
        const allStepRows = stepsContainer.querySelectorAll('.step-row');
        allStepRows.forEach((row, i) => {
          if (i !== stepIdx && row._toggle) row._toggle(false);
        });
      },
      onAddScorePoint(stepIdx) {
        const sp = step.scorePoints;
        const lastSP = sp[sp.length - 1];
        if (lastSP && lastSP.scoreCode === 'ADD') {
          toast('请勿重复添加', 'warning');
          return;
        }
        sp.push(createDefaultScorePoint());
        formatConfigJson(configJson);
        renderAll();
        markDirty();
      },
      async onRemoveStep(stepIdx) {
        if (!await confirmRemove('步骤', step.stepCode || step.stepName || `第 ${stepIdx + 1} 步`)) return;
        configJson.steps.splice(stepIdx, 1);
        formatConfigJson(configJson);
        renderAll();
        markDirty();
      },
      onReorder(fromIdx, toIdx) {
        const steps = configJson.steps;
        const [moved] = steps.splice(fromIdx, 1);
        steps.splice(toIdx, 0, moved);
        formatConfigJson(configJson);
        renderAll();
        markDirty();
      },
    });
    stepsContainer.appendChild(stepComp.root);

    // Render scorePoints within this step
    const spContainer = stepComp.root._getChildrenContainer();
    if (spContainer && step.scorePoints.length > 0) {
      step.scorePoints.forEach((sp, spIndex) => {
        const spComp = renderScorePointRow(sp, spIndex, stepIndex, configJson, {
          onChange() {
            markDirty();
            formatConfigJson(configJson);
            refreshStats();
          },
          onExpand(stepIdx, spIdx) {
            const allSPRows = spContainer.querySelectorAll('.scorepoint-row');
            allSPRows.forEach((row, i) => {
              if (i !== spIdx && row._toggle) row._toggle(false);
            });
          },
          onAddScoreEvent(stepIdx, spIdx) {
            const se = sp.scoreEvents;
            const lastSE = se[se.length - 1];
            if (lastSE && lastSE.scoreEventCode === 'ADD') {
              toast('请勿重复添加', 'warning');
              return;
            }
            se.push(createDefaultScoreEvent());
            formatConfigJson(configJson);
            renderAll();
            markDirty();
          },
          async onRemoveScorePoint(stepIdx, spIdx) {
            if (!await confirmRemove('评分点', sp.scoreCode || `第 ${spIdx + 1} 个评分点`)) return;
            step.scorePoints.splice(spIdx, 1);
            formatConfigJson(configJson);
            renderAll();
            markDirty();
          },
        });
        spContainer.appendChild(spComp.root);

        // Render scoreEvents within this scorePoint
        const seContainer = spComp.root._getChildrenContainer();
        if (seContainer && sp.scoreEvents.length > 0) {
          sp.scoreEvents.forEach((se, seIndex) => {
            const seComp = renderScoreEventRow(se, seIndex, stepIndex, spIndex, configJson, {
              onChange() {
                markDirty();
                formatConfigJson(configJson);
                refreshStats();
              },
              onExpand(stepIdx, spIdx, seIdx) {
                const allSERows = seContainer.querySelectorAll('.scoreevent-row');
                allSERows.forEach((row, i) => {
                  if (i !== seIdx && row._toggle) row._toggle(false);
                });
              },
              onAddAiEvent(stepIdx, spIdx, seIdx) {
                const ae = se.events;
                const lastAE = ae[ae.length - 1];
                if (lastAE && lastAE.eventCode === 'ADD') {
                  toast('请勿重复添加', 'warning');
                  return;
                }
                ae.push(createDefaultAiEvent());
                formatConfigJson(configJson);
                renderAll();
                markDirty();
              },
              async onRemoveScoreEvent(stepIdx, spIdx, seIdx) {
                if (!await confirmRemove('评分事件', se.scoreEventCode || `第 ${seIdx + 1} 个评分事件`)) return;
                step.scorePoints[spIdx].scoreEvents.splice(seIdx, 1);
                formatConfigJson(configJson);
                renderAll();
                markDirty();
              },
            });
            seContainer.appendChild(seComp.root);

            // Render AIEvents within this scoreEvent
            const aeContainer = seComp.root._getChildrenContainer();
            if (aeContainer && se.events.length > 0) {
              se.events.forEach((ae, aeIndex) => {
                const aeComp = renderAiEventRow(ae, aeIndex, stepIndex, spIndex, seIndex, configJson, {
                  onChange() {
                    markDirty();
                    refreshStats();
                  },
                  onRemoveAiEvent(stepIdx, spIdx, seIdx, aeIdx) {
                    step.scorePoints[spIdx].scoreEvents[seIdx].events.splice(aeIdx, 1);
                    formatConfigJson(configJson);
                    renderAll();
                    markDirty();
                  },
                });
                aeContainer.appendChild(aeComp.root);
              });
            }
          });
        }
      });
    }
  });

  stepsSection.appendChild(stepsContainer);
  root.appendChild(stepsSection);

  // Error events
  errorEventsComp = renderErrorEvents(configJson.errorEvents, configJson, {
    onChange() {
      markDirty();
      refreshStats();
    },
  });
  root.appendChild(errorEventsComp.container);

  refreshStats();
}

function createValidationPanel() {
  const panel = document.createElement('div');
  panel.className = 'validation-panel';
  panel.style.display = 'none';

  const title = document.createElement('div');
  title.className = 'validation-title';
  panel.appendChild(title);

  const list = document.createElement('ol');
  list.className = 'validation-list';
  panel.appendChild(list);

  panel._render = (issues, action) => {
    list.innerHTML = '';
    title.textContent = `${action}前请先处理 ${issues.length} 个问题`;
    issues.slice(0, 20).forEach((issue) => {
      const item = document.createElement('li');
      const path = document.createElement('span');
      path.className = 'validation-path';
      path.textContent = issue.path;
      const message = document.createElement('span');
      message.textContent = issue.message;
      item.appendChild(path);
      item.appendChild(document.createTextNode('：'));
      item.appendChild(message);
      list.appendChild(item);
    });
    if (issues.length > 20) {
      const item = document.createElement('li');
      item.textContent = `还有 ${issues.length - 20} 个问题未显示`;
      list.appendChild(item);
    }
    panel.style.display = 'block';
    panel.scrollIntoView({ block: 'nearest' });
  };

  panel._clear = () => {
    list.innerHTML = '';
    panel.style.display = 'none';
  };

  return panel;
}

function createStatusBar() {
  const bar = document.createElement('div');
  bar.className = 'status-bar status-clean';

  const dot = document.createElement('span');
  dot.className = 'status-dot';
  bar.appendChild(dot);

  const text = document.createElement('span');
  text.className = 'status-text';
  bar.appendChild(text);

  bar._setStatus = (type, message) => {
    bar.className = `status-bar status-${type}`;
    text.textContent = `${message} · ${formatTime(new Date())}`;
  };

  return bar;
}

function updateStatus(type, message) {
  if (statusBar && statusBar._setStatus) {
    statusBar._setStatus(type, message);
  }
}

function markDirty(message = '存在未保存修改') {
  updateStatus('dirty', message);
}

function confirmRemove(type, label) {
  return confirmDialog({
    title: `移除${type}`,
    message: `确定移除${type}「${label}」？此操作会删除其下级配置。`,
    confirmText: '移除',
  });
}

function confirmDialog({ title, message, confirmText = '确定', cancelText = '取消' }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');

    const titleEl = document.createElement('div');
    titleEl.className = 'confirm-title';
    titleEl.textContent = title;
    dialog.appendChild(titleEl);

    const messageEl = document.createElement('div');
    messageEl.className = 'confirm-message';
    messageEl.textContent = message;
    dialog.appendChild(messageEl);

    const actions = document.createElement('div');
    actions.className = 'confirm-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-default';
    cancelBtn.textContent = cancelText;
    actions.appendChild(cancelBtn);

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-danger';
    confirmBtn.textContent = confirmText;
    actions.appendChild(confirmBtn);

    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.documentElement.classList.add('confirm-open');
    document.body.classList.add('confirm-open');
    document.documentElement.appendChild(overlay);

    function close(result) {
      document.removeEventListener('keydown', onKeydown);
      document.documentElement.classList.remove('confirm-open');
      document.body.classList.remove('confirm-open');
      overlay.remove();
      resolve(result);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') close(false);
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });
    cancelBtn.addEventListener('click', () => close(false));
    confirmBtn.addEventListener('click', () => close(true));
    document.addEventListener('keydown', onKeydown);
    confirmBtn.focus();
  });
}

function formatTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function showValidationIssues(issues, action) {
  renderValidationIssues(issues, action);
  updateStatus('error', `${action}失败，存在配置问题`);
  toast(`${action}失败，请先处理配置问题`, 'error');
}

function renderValidationIssues(issues, action) {
  if (validationPanel && validationPanel._render) {
    validationPanel._render(issues, action);
  }
}

function clearValidationIssues() {
  if (validationPanel && validationPanel._clear) {
    validationPanel._clear();
  }
}

function ensureConfigReady(action) {
  const err = formatConfigJson(configJson);
  if (err) {
    showValidationIssues([{ path: '配置格式', message: err.error }], action);
    return false;
  }

  const issues = validateConfig(configJson);
  if (issues.length > 0) {
    showValidationIssues(issues, action);
    return false;
  }

  clearValidationIssues();
  return true;
}

function showImportValidationResult(source) {
  const issues = validateConfig(configJson);
  if (issues.length > 0) {
    renderValidationIssues(issues, '导入');
    updateStatus('error', `${source} 导入成功，但存在配置问题`);
    toast(`${source} 导入成功，但存在配置问题`, 'warning');
    return;
  }
  clearValidationIssues();
  updateStatus('success', `${source} 导入成功，已自动保存`);
  toast(`${source} 导入成功`, 'success');
}

function handleImportedConfig(loaded, source) {
  configJson = loaded;
  renderAll();
  showImportValidationResult(source);
}

async function restoreBackupConfig() {
  const exists = await store.backupExists();
  if (!exists) {
    updateStatus('error', '没有可恢复的导入前备份');
    toast('没有可恢复的备份', 'warning');
    return;
  }
  const confirmed = await confirmDialog({
    title: '恢复备份',
    message: '确定恢复最近一次导入前备份？当前配置会被备份覆盖。',
    confirmText: '恢复备份',
  });
  if (!confirmed) return;

  const restored = await store.restoreBackupConfig();
  if (!restored) {
    updateStatus('error', '备份恢复失败');
    toast('备份恢复失败', 'error');
    return;
  }

  configJson = restored;
  renderAll();
  const issues = validateConfig(configJson);
  if (issues.length > 0) {
    renderValidationIssues(issues, '恢复');
    updateStatus('error', '备份已恢复，但存在配置问题');
    toast('备份已恢复，但存在配置问题', 'warning');
    return;
  }
  clearValidationIssues();
  updateStatus('success', '已恢复导入前备份');
  toast('已恢复导入前备份', 'success');
}

async function exportConfig(suffix, formatter) {
  if (!ensureConfigReady('导出')) return;
  try {
    await store.saveConfig(configJson);
    const exported = formatter(configJson);
    downloadJsonFile(exported, configJson.name, suffix);
    updateStatus('success', `${suffix}配置已导出，当前配置已保存`);
    toast(`导出成功（${suffix}）`, 'success');
  } catch (e) {
    updateStatus('error', '导出失败');
    toast('导出失败: ' + e.message, 'error');
  }
}

function refreshStats() {
  if (topForm) {
    topForm.updateStat(sumStepScore, sumStepScoreCorrect, configJson.experimentTotalScore);
  }
  // Update all step rows
  document.querySelectorAll('.step-row').forEach(row => {
    if (row._updateStat) row._updateStat();
  });
  document.querySelectorAll('.scorepoint-row').forEach(row => {
    if (row._updateStat) row._updateStat();
  });
}

async function saveConfig() {
  if (!ensureConfigReady('保存')) return;
  try {
    await store.saveConfig(configJson);
    updateStatus('clean', '配置已保存');
    toast('保存成功', 'success');
  } catch (e) {
    toast('保存失败: ' + e.message, 'error');
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', async () => {
  const saved = await store.loadConfig();
  if (saved) {
    configJson = saved;
    formatConfigJson(configJson);
    renderAll();
  } else {
    showEmptyState();
  }
});
