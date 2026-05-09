function renderScoreEventRow(scoreEvent, seIndex, stepIndex, spIndex, configJson, callbacks) {
  const tpl = document.getElementById('tpl-scoreevent-row');
  const frag = tpl.content.cloneNode(true);
  const root = frag.querySelector('.scoreevent-row');

  const els = {
    scoreEventType: root.querySelector('.field-scoreEventType'),
    scoreEventCode: root.querySelector('.field-scoreEventCode'),
    scoreEventIsCorrect: root.querySelector('.field-scoreEventIsCorrect'),
    scoreEventValue: root.querySelector('.field-scoreEventValue'),
    scoreEventDefaultStatus: root.querySelector('.field-scoreEventDefaultStatus'),
    scoreEventEnable: root.querySelector('.field-scoreEventEnable'),
    scoreEventDesc: root.querySelector('.field-scoreEventDesc'),
    stat: root.querySelector('.stat'),
    descRow: root.querySelector('.scoreevent-desc-row'),
    children: root.querySelector('.scoreevent-children'),
  };

  function syncToDOM() {
    els.scoreEventType.value = scoreEvent.scoreEventType;
    els.scoreEventCode.value = scoreEvent.scoreEventCode;
    els.scoreEventIsCorrect.value = scoreEvent.scoreEventIsCorrect;
    els.scoreEventValue.value = scoreEvent.scoreEventValue;
    els.scoreEventDefaultStatus.value = scoreEvent.scoreEventDefaultStatus;
    els.scoreEventEnable.value = scoreEvent.scoreEventEnable;
    els.scoreEventDesc.value = scoreEvent.scoreEventDesc || '';
  }

  function syncFromDOM() {
    scoreEvent.scoreEventType = Number(els.scoreEventType.value);
    scoreEvent.scoreEventCode = els.scoreEventCode.value;
    scoreEvent.scoreEventIsCorrect = Number(els.scoreEventIsCorrect.value);
    scoreEvent.scoreEventValue = parseFloat(els.scoreEventValue.value) || 0;
    scoreEvent.scoreEventDefaultStatus = Number(els.scoreEventDefaultStatus.value);
    scoreEvent.scoreEventEnable = Number(els.scoreEventEnable.value);
    scoreEvent.scoreEventDesc = els.scoreEventDesc.value;
  }

  [els.scoreEventType, els.scoreEventCode, els.scoreEventIsCorrect, els.scoreEventDefaultStatus, els.scoreEventEnable, els.scoreEventDesc].forEach(el => {
    el.addEventListener('input', () => { syncFromDOM(); callbacks.onChange(); });
    el.addEventListener('change', () => { syncFromDOM(); callbacks.onChange(); });
  });
  els.scoreEventValue.addEventListener('input', () => {
    scoreEvent.scoreEventValue = parseFloat(els.scoreEventValue.value) || 0;
    callbacks.onChange();
  });

  const btnToggle = root.querySelector('.btn-toggle-se');
  btnToggle.addEventListener('click', () => {
    const isOpen = els.descRow.style.display !== 'none';
    els.descRow.style.display = isOpen ? 'none' : '';
    els.children.style.display = isOpen ? 'none' : 'block';
    btnToggle.textContent = isOpen ? '展开' : '收起';
    if (!isOpen && callbacks.onExpand) callbacks.onExpand(stepIndex, spIndex, seIndex);
  });

  root.querySelector('.btn-add-ae').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onAddAiEvent) callbacks.onAddAiEvent(stepIndex, spIndex, seIndex);
  });

  root.querySelector('.btn-remove-se').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onRemoveScoreEvent) callbacks.onRemoveScoreEvent(stepIndex, spIndex, seIndex);
  });

  root._syncToDOM = syncToDOM;
  root._syncFromDOM = syncFromDOM;
  root._getChildrenContainer = () => els.children;
  root._toggle = (open) => {
    els.descRow.style.display = open ? '' : 'none';
    els.children.style.display = open ? 'block' : 'none';
    btnToggle.textContent = open ? '收起' : '展开';
  };

  syncToDOM();
  return { root, els, syncToDOM, syncFromDOM };
}

export { renderScoreEventRow };
