import { sumStepScorePointEvent, sumStepScorePointEventCorrect } from '../model.js';

function renderScorePointRow(scorePoint, spIndex, stepIndex, configJson, callbacks) {
  const tpl = document.getElementById('tpl-scorepoint-row');
  const frag = tpl.content.cloneNode(true);
  const root = frag.querySelector('.scorepoint-row');

  const els = {
    scoreType: root.querySelector('.field-scoreType'),
    scoreCode: root.querySelector('.field-scoreCode'),
    scoreIsCorrect: root.querySelector('.field-scoreIsCorrect'),
    scoreTotalScore: root.querySelector('.field-scoreTotalScore'),
    scoreDefaultScoreType: root.querySelector('.field-scoreDefaultScoreType'),
    scoreEnable: root.querySelector('.field-scoreEnable'),
    scoreDesc: root.querySelector('.field-scoreDesc'),
    stat: root.querySelector('.stat'),
    descRow: root.querySelector('.scorepoint-desc-row'),
    children: root.querySelector('.scorepoint-children'),
  };

  function syncToDOM() {
    els.scoreType.value = scorePoint.scoreType;
    els.scoreCode.value = scorePoint.scoreCode;
    els.scoreIsCorrect.value = scorePoint.scoreIsCorrect;
    els.scoreTotalScore.value = scorePoint.scoreTotalScore;
    els.scoreDefaultScoreType.value = scorePoint.scoreDefaultScoreType;
    els.scoreEnable.value = scorePoint.scoreEnable;
    els.scoreDesc.value = scorePoint.scoreDesc || '';
    updateStat();
  }

  function syncFromDOM() {
    scorePoint.scoreType = Number(els.scoreType.value);
    scorePoint.scoreCode = els.scoreCode.value;
    scorePoint.scoreIsCorrect = Number(els.scoreIsCorrect.value);
    scorePoint.scoreTotalScore = parseFloat(els.scoreTotalScore.value) || 0;
    scorePoint.scoreDefaultScoreType = Number(els.scoreDefaultScoreType.value);
    scorePoint.scoreEnable = Number(els.scoreEnable.value);
    scorePoint.scoreDesc = els.scoreDesc.value;
  }

  function updateStat() {
    const eventSum = sumStepScorePointEvent(scorePoint);
    const correct = sumStepScorePointEventCorrect(scorePoint, scorePoint.scoreTotalScore);
    els.stat.textContent = '评分事件统计分：' + eventSum;
    els.stat.style.color = correct ? '#01a850' : '#c52c2c';
  }

  [els.scoreType, els.scoreCode, els.scoreIsCorrect, els.scoreDefaultScoreType, els.scoreEnable, els.scoreDesc].forEach(el => {
    el.addEventListener('input', () => { syncFromDOM(); callbacks.onChange(); });
    el.addEventListener('change', () => { syncFromDOM(); callbacks.onChange(); });
  });
  els.scoreTotalScore.addEventListener('input', () => {
    scorePoint.scoreTotalScore = parseFloat(els.scoreTotalScore.value) || 0;
    callbacks.onChange();
  });

  const btnToggle = root.querySelector('.btn-toggle-sp');
  btnToggle.addEventListener('click', () => {
    const isOpen = els.descRow.style.display !== 'none';
    els.descRow.style.display = isOpen ? 'none' : '';
    els.children.style.display = isOpen ? 'none' : 'block';
    btnToggle.textContent = isOpen ? '展开' : '收起';
    if (!isOpen && callbacks.onExpand) callbacks.onExpand(stepIndex, spIndex);
  });

  root.querySelector('.btn-add-se').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onAddScoreEvent) callbacks.onAddScoreEvent(stepIndex, spIndex);
  });

  root.querySelector('.btn-remove-sp').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onRemoveScorePoint) callbacks.onRemoveScorePoint(stepIndex, spIndex);
  });

  root._syncToDOM = syncToDOM;
  root._syncFromDOM = syncFromDOM;
  root._updateStat = updateStat;
  root._getChildrenContainer = () => els.children;
  root._toggle = (open) => {
    els.descRow.style.display = open ? '' : 'none';
    els.children.style.display = open ? 'block' : 'none';
    btnToggle.textContent = open ? '收起' : '展开';
  };

  syncToDOM();
  return { root, els, syncToDOM, syncFromDOM, updateStat };
}

export { renderScorePointRow };
