import {
  sumStepScorePoint, sumStepScorePointCorrect,
  getAllAiEventCodes,
} from '../model.js';

function renderStepRow(step, stepIndex, configJson, callbacks) {
  const tpl = document.getElementById('tpl-step-row');
  const frag = tpl.content.cloneNode(true);
  const root = frag.querySelector('.step-row');

  const els = {
    index: root.querySelector('.step-index'),
    stepType: root.querySelector('.field-stepType'),
    stepCode: root.querySelector('.field-stepCode'),
    stepTotalScore: root.querySelector('.field-stepTotalScore'),
    stepDefaultScoreType: root.querySelector('.field-stepDefaultScoreType'),
    stepEnable: root.querySelector('.field-stepEnable'),
    stepDesc: root.querySelector('.field-stepDesc'),
    stepName: root.querySelector('.field-stepName'),
    stat: root.querySelector('.stat'),
    descRow: root.querySelector('.step-desc-row'),
    children: root.querySelector('.step-children'),
    finishedRules: root.querySelector('.finished-rules-section'),
  };

  function syncToDOM() {
    els.index.textContent = step.stepNum;
    els.stepType.value = step.stepType;
    els.stepCode.value = step.stepCode;
    els.stepTotalScore.value = step.stepTotalScore;
    els.stepDefaultScoreType.value = step.stepDefaultScoreType;
    els.stepEnable.value = step.stepEnable;
    els.stepDesc.value = step.stepDesc || '';
    els.stepName.value = step.stepName || '';
    updateStat();
    renderFinishedRules();
  }

  function syncFromDOM() {
    step.stepType = Number(els.stepType.value);
    step.stepCode = els.stepCode.value;
    step.stepTotalScore = parseFloat(els.stepTotalScore.value) || 0;
    step.stepDefaultScoreType = Number(els.stepDefaultScoreType.value);
    step.stepEnable = Number(els.stepEnable.value);
    step.stepDesc = els.stepDesc.value;
    step.stepName = els.stepName.value;
    // Read finished rules
    const ruleSelects = els.finishedRules.querySelectorAll('.field-ruleEventCodes');
    step.stepFinishedRules = [];
    ruleSelects.forEach(sel => {
      const codes = [];
      for (let o of sel.selectedOptions) {
        if (o.value) codes.push(o.value);
      }
      step.stepFinishedRules.push(codes);
    });
    if (step.stepFinishedRules.length === 0) {
      step.stepFinishedRules = [[]];
    }
  }

  function updateStat() {
    const scorePointSum = sumStepScorePoint(step);
    const correct = sumStepScorePointCorrect(step, step.stepTotalScore);
    els.stat.textContent = '评分点统计分：' + scorePointSum;
    els.stat.style.color = correct ? '#01a850' : '#c52c2c';
  }

  function renderFinishedRules() {
    els.finishedRules.innerHTML = '';
    const rules = step.stepFinishedRules || [[]];
    const allCodes = getAllAiEventCodes(configJson);

    rules.forEach((ruleCodes) => {
      const rtpl = document.getElementById('tpl-finishedrule-row');
      const rfrag = rtpl.content.cloneNode(true);
      const rrow = rfrag.querySelector('.finishedrule-row');
      const sel = rrow.querySelector('.field-ruleEventCodes');
      populateMultiSelect(sel, allCodes, ruleCodes || []);
      rrow.querySelector('.btn-remove-rule').addEventListener('click', () => {
        syncFromDOM();
        rrow.remove();
      });
      els.finishedRules.appendChild(rfrag);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-sm btn-default';
    addBtn.textContent = '+ 规则';
    addBtn.addEventListener('click', () => {
      syncFromDOM();
      if (!step.stepFinishedRules) step.stepFinishedRules = [];
      step.stepFinishedRules.push([]);
      renderFinishedRules();
    });
    els.finishedRules.appendChild(addBtn);
  }

  // Bind inputs
  [els.stepType, els.stepCode, els.stepDefaultScoreType, els.stepEnable, els.stepDesc, els.stepName].forEach(el => {
    el.addEventListener('input', () => { syncFromDOM(); callbacks.onChange(); });
    el.addEventListener('change', () => { syncFromDOM(); callbacks.onChange(); });
  });
  els.stepTotalScore.addEventListener('input', () => {
    step.stepTotalScore = parseFloat(els.stepTotalScore.value) || 0;
    callbacks.onChange();
  });

  // Toggle
  const btnToggle = root.querySelector('.btn-toggle-step');
  btnToggle.addEventListener('click', () => {
    const isOpen = els.descRow.style.display !== 'none';
    els.descRow.style.display = isOpen ? 'none' : 'flex';
    els.children.style.display = isOpen ? 'none' : 'block';
    btnToggle.textContent = isOpen ? '展开' : '收起';
    if (!isOpen && callbacks.onExpand) callbacks.onExpand(stepIndex);
  });

  // Add scorePoint
  root.querySelector('.btn-add-sp').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onAddScorePoint) callbacks.onAddScorePoint(stepIndex);
  });

  // Remove step
  root.querySelector('.btn-remove-step').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onRemoveStep) callbacks.onRemoveStep(stepIndex);
  });

  // Drag
  const handle = root.querySelector('.drag-handle');
  handle.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', String(stepIndex));
    root.classList.add('dragging');
  });
  handle.addEventListener('dragend', () => {
    root.classList.remove('dragging');
  });

  root.addEventListener('dragover', (e) => {
    e.preventDefault();
    root.classList.add('drag-over');
  });
  root.addEventListener('dragleave', () => {
    root.classList.remove('drag-over');
  });
  root.addEventListener('drop', (e) => {
    e.preventDefault();
    root.classList.remove('drag-over');
    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIdx) && fromIdx !== stepIndex && callbacks.onReorder) {
      callbacks.onReorder(fromIdx, stepIndex);
    }
  });

  // Expose
  root._syncToDOM = syncToDOM;
  root._syncFromDOM = syncFromDOM;
  root._updateStat = updateStat;
  root._getChildrenContainer = () => els.children;
  root._toggle = (open) => {
    els.descRow.style.display = open ? 'flex' : 'none';
    els.children.style.display = open ? 'block' : 'none';
    btnToggle.textContent = open ? '收起' : '展开';
  };

  syncToDOM();
  return { root, els, syncToDOM, syncFromDOM, updateStat };
}

function populateMultiSelect(select, options, selected) {
  select.innerHTML = '';
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    o.selected = (selected || []).includes(opt);
    select.appendChild(o);
  });
}

export { renderStepRow, populateMultiSelect };
