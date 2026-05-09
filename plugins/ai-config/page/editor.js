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
import { renderTopForm } from './components/top-form.js';
import { renderStepRow } from './components/step-row.js';
import { renderScorePointRow } from './components/scorepoint-row.js';
import { renderScoreEventRow } from './components/scoreevent-row.js';
import { renderAiEventRow } from './components/aievent-row.js';
import { renderErrorEvents } from './components/error-events.js';

let configJson = null;
let topForm = null;
let errorEventsComp = null;

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
  const tpl = document.getElementById('tpl-empty-state');
  const es = tpl.content.firstElementChild.cloneNode(true);
  es.querySelector('#btn-new-config').addEventListener('click', () => {
    configJson = createDefaultConfig();
    renderAll();
  });
  root.appendChild(es);
}

function renderAll() {
  const root = document.getElementById('editor-root');
  root.innerHTML = '';

  if (!configJson) {
    showEmptyState();
    return;
  }

  // Top form
  topForm = renderTopForm(configJson, {
    onChange() {
      refreshStats();
    },
    onSave() {
      saveConfig();
    },
    onClear() {
      store.clearConfig().then(() => {
        configJson = null;
        showEmptyState();
        toast('配置已清空', 'success');
      });
    },
    onExportUpload() {
      const exported = formatExportConfigJson(configJson);
      downloadJsonFile(exported, configJson.name, '上传版');
      toast('导出成功（上传版）', 'success');
    },
    onExportPlatform() {
      const exported = formatPlatformConfigJson(configJson);
      downloadJsonFile(exported, configJson.name, '平台-上传版');
      toast('导出成功（平台版）', 'success');
    },
    onExportBox() {
      const exported = formatAiServerConfigJson(configJson);
      downloadJsonFile(exported, configJson.name, '盒子版');
      toast('导出成功（盒子版）', 'success');
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
        configJson = loaded;
        renderAll();
        toast('Excel 导入成功', 'success');
      } else {
        toast('Excel 导入失败', 'error');
      }
    },
    async onUploadJson(file) {
      const err = await importJsonFile(file);
      if (err) { toast(err.error, 'error'); return; }
      const loaded = await store.loadConfig();
      if (loaded) {
        configJson = loaded;
        renderAll();
        toast('JSON 导入成功', 'success');
      } else {
        toast('JSON 导入失败', 'error');
      }
    },
  });
  root.appendChild(topForm.root);
  topForm.syncToDOM();

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
  });
  stepsHeader.appendChild(addStepBtn);
  stepsSection.appendChild(stepsHeader);

  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'steps-container';

  configJson.steps.forEach((step, stepIndex) => {
    const stepComp = renderStepRow(step, stepIndex, configJson, {
      onChange() {
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
      },
      onRemoveStep(stepIdx) {
        configJson.steps.splice(stepIdx, 1);
        formatConfigJson(configJson);
        renderAll();
      },
      onReorder(fromIdx, toIdx) {
        const steps = configJson.steps;
        const [moved] = steps.splice(fromIdx, 1);
        steps.splice(toIdx, 0, moved);
        formatConfigJson(configJson);
        renderAll();
      },
    });
    stepsContainer.appendChild(stepComp.root);

    // Render scorePoints within this step
    const spContainer = stepComp.root._getChildrenContainer();
    if (spContainer && step.scorePoints.length > 0) {
      step.scorePoints.forEach((sp, spIndex) => {
        const spComp = renderScorePointRow(sp, spIndex, stepIndex, configJson, {
          onChange() {
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
          },
          onRemoveScorePoint(stepIdx, spIdx) {
            step.scorePoints.splice(spIdx, 1);
            formatConfigJson(configJson);
            renderAll();
          },
        });
        spContainer.appendChild(spComp.root);

        // Render scoreEvents within this scorePoint
        const seContainer = spComp.root._getChildrenContainer();
        if (seContainer && sp.scoreEvents.length > 0) {
          sp.scoreEvents.forEach((se, seIndex) => {
            const seComp = renderScoreEventRow(se, seIndex, stepIndex, spIndex, configJson, {
              onChange() {
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
              },
              onRemoveScoreEvent(stepIdx, spIdx, seIdx) {
                step.scorePoints[spIdx].scoreEvents.splice(seIdx, 1);
                formatConfigJson(configJson);
                renderAll();
              },
            });
            seContainer.appendChild(seComp.root);

            // Render AIEvents within this scoreEvent
            const aeContainer = seComp.root._getChildrenContainer();
            if (aeContainer && se.events.length > 0) {
              se.events.forEach((ae, aeIndex) => {
                const aeComp = renderAiEventRow(ae, aeIndex, stepIndex, spIndex, seIndex, configJson, {
                  onChange() {
                    refreshStats();
                  },
                  onRemoveAiEvent(stepIdx, spIdx, seIdx, aeIdx) {
                    step.scorePoints[spIdx].scoreEvents[seIdx].events.splice(aeIdx, 1);
                    formatConfigJson(configJson);
                    renderAll();
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
      refreshStats();
    },
  });
  root.appendChild(errorEventsComp.container);

  refreshStats();
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
  const err = formatConfigJson(configJson);
  if (err) {
    toast(err.error, 'error');
    return;
  }
  try {
    await store.saveConfig(configJson);
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
