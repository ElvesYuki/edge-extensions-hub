import { getAllAiEventCodes } from '../model.js';
import { populateMultiSelect } from './step-row.js';

function renderAiEventRow(aiEvent, aeIndex, stepIndex, spIndex, seIndex, configJson, callbacks) {
  const tpl = document.getElementById('tpl-aievent-row');
  const frag = tpl.content.cloneNode(true);
  const root = frag.querySelector('.aievent-row');

  const els = {
    eventCode: root.querySelector('.field-eventCode'),
    eventScore: root.querySelector('.field-eventScore'),
    duration: root.querySelector('.field-duration'),
    eventDesc: root.querySelector('.field-eventDesc'),
    depsSection: root.querySelector('.event-deps-section'),
  };

  function syncToDOM() {
    els.eventCode.value = aiEvent.eventCode || '';
    els.eventScore.value = aiEvent.eventScore || 0;
    els.duration.value = aiEvent.duration || 0;
    els.eventDesc.value = aiEvent.eventDesc || '';
    renderDeps();
  }

  function syncFromDOM() {
    aiEvent.eventCode = els.eventCode.value;
    aiEvent.eventScore = parseFloat(els.eventScore.value) || 0;
    aiEvent.duration = Number(els.duration.value) || 0;
    aiEvent.eventDesc = els.eventDesc.value;
    readDeps();
  }

  function renderDeps() {
    els.depsSection.innerHTML = '';
    const deps = aiEvent.eventDeps || [];
    const allCodes = getAllAiEventCodes(configJson);

    deps.forEach((dep) => {
      const dtpl = document.getElementById('tpl-eventdep-row');
      const dfrag = dtpl.content.cloneNode(true);
      const drow = dfrag.querySelector('.eventdep-row');
      drow.querySelector('.field-depType').value = dep.type || 'OCCURRING_ALL';
      const codesSel = drow.querySelector('.field-depEventCodes');
      populateMultiSelect(codesSel, allCodes, dep.eventCodes || []);
      drow.querySelector('.btn-remove-dep').addEventListener('click', () => {
        syncFromDOM();
        drow.remove();
      });
      els.depsSection.appendChild(dfrag);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-sm btn-default';
    addBtn.textContent = '+ 依赖';
    addBtn.addEventListener('click', () => {
      syncFromDOM();
      if (!aiEvent.eventDeps) aiEvent.eventDeps = [];
      aiEvent.eventDeps.push({ type: 'OCCURRING_ALL', eventCodes: [] });
      renderDeps();
    });
    els.depsSection.appendChild(addBtn);
  }

  function readDeps() {
    const depRows = els.depsSection.querySelectorAll('.eventdep-row');
    aiEvent.eventDeps = [];
    depRows.forEach(row => {
      const type = row.querySelector('.field-depType').value;
      const codesSel = row.querySelector('.field-depEventCodes');
      const codes = [];
      for (let o of codesSel.selectedOptions) {
        if (o.value) codes.push(o.value);
      }
      aiEvent.eventDeps.push({ type, eventCodes: codes });
    });
  }

  [els.eventCode, els.eventDesc].forEach(el => {
    el.addEventListener('input', () => { syncFromDOM(); callbacks.onChange(); });
  });
  els.eventScore.addEventListener('input', () => {
    aiEvent.eventScore = parseFloat(els.eventScore.value) || 0;
    callbacks.onChange();
  });
  els.duration.addEventListener('input', () => {
    aiEvent.duration = Number(els.duration.value) || 0;
    callbacks.onChange();
  });

  root.querySelector('.btn-remove-ae').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onRemoveAiEvent) callbacks.onRemoveAiEvent(stepIndex, spIndex, seIndex, aeIndex);
  });

  root._syncToDOM = syncToDOM;
  root._syncFromDOM = syncFromDOM;

  syncToDOM();
  return { root, els, syncToDOM, syncFromDOM };
}

export { renderAiEventRow };
