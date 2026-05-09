import { getAllAiEventCodes } from '../model.js';
import { populateMultiSelect } from './step-row.js';

function renderErrorEvents(errorEvents, configJson, callbacks) {
  const container = document.createElement('div');
  container.className = 'error-events-section';
  container.innerHTML = `<h3>错误事件</h3><div class="error-events-list"></div>`;

  const listEl = container.querySelector('.error-events-list');

  let collapsed = false;
  const toggleLink = document.createElement('span');
  toggleLink.className = 'toggle-section';
  toggleLink.textContent = '收起';
  toggleLink.addEventListener('click', () => {
    collapsed = !collapsed;
    listEl.style.display = collapsed ? 'none' : '';
    toggleLink.textContent = collapsed ? '展开' : '收起';
  });

  const headerArea = container.querySelector('h3');
  headerArea.appendChild(document.createTextNode(' '));
  headerArea.appendChild(toggleLink);

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-sm btn-success';
  addBtn.textContent = '+ 错误事件';
  addBtn.style.marginLeft = '16px';
  headerArea.appendChild(addBtn);

  addBtn.addEventListener('click', () => {
    const newEvent = {
      eventCode: '', eventDesc: '', eventScore: 0, duration: 0,
      eventPriority: 1, eventStatus: 0, eventDeps: [], belongStep: '',
    };
    errorEvents.push(newEvent);
    renderList();
    if (callbacks.onChange) callbacks.onChange();
  });

  function renderList() {
    listEl.innerHTML = '';
    const allCodes = getAllAiEventCodes(configJson);
    const stepCodes = (configJson.steps || []).map(s => s.stepCode).filter(Boolean);

    errorEvents.forEach((evt, idx) => {
      const tpl = document.getElementById('tpl-error-event-row');
      const frag = tpl.content.cloneNode(true);
      const row = frag.querySelector('.error-event-row');

      row.querySelector('.field-eventCode').value = evt.eventCode || '';
      row.querySelector('.field-eventScore').value = evt.eventScore || 0;
      row.querySelector('.field-duration').value = evt.duration || 0;
      row.querySelector('.field-eventDesc').value = evt.eventDesc || '';

      const belongSel = row.querySelector('.field-belongStep');
      belongSel.innerHTML = '<option value="">--</option>';
      stepCodes.forEach(sc => {
        const o = document.createElement('option');
        o.value = sc;
        o.textContent = sc;
        o.selected = evt.belongStep === sc;
        belongSel.appendChild(o);
      });

      // Deps
      const depsSection = row.querySelector('.event-deps-section');
      function renderDeps() {
        depsSection.innerHTML = '';
        (evt.eventDeps || []).forEach((dep) => {
          const dtpl = document.getElementById('tpl-eventdep-row');
          const dfrag = dtpl.content.cloneNode(true);
          const drow = dfrag.querySelector('.eventdep-row');
          drow.querySelector('.field-depType').value = dep.type || 'OCCURRING_ALL';
          const codesSel = drow.querySelector('.field-depEventCodes');
          populateMultiSelect(codesSel, allCodes, dep.eventCodes || []);
          drow.querySelector('.btn-remove-dep').addEventListener('click', () => {
            readErrorEvent(evt, row);
            drow.remove();
          });
          depsSection.appendChild(dfrag);
        });
        const addDepBtn = document.createElement('button');
        addDepBtn.className = 'btn btn-sm btn-default';
        addDepBtn.textContent = '+ 依赖';
        addDepBtn.addEventListener('click', () => {
          readErrorEvent(evt, row);
          if (!evt.eventDeps) evt.eventDeps = [];
          evt.eventDeps.push({ type: 'OCCURRING_ALL', eventCodes: [] });
          renderDeps();
        });
        depsSection.appendChild(addDepBtn);
      }
      renderDeps();

      // Input bindings
      ['eventCode', 'eventDesc'].forEach(k => {
        row.querySelector(`.field-${k}`).addEventListener('input', () => {
          readErrorEvent(evt, row);
          if (callbacks.onChange) callbacks.onChange();
        });
      });
      ['eventScore', 'duration'].forEach(k => {
        row.querySelector(`.field-${k}`).addEventListener('input', () => {
          evt[k] = parseFloat(row.querySelector(`.field-${k}`).value) || 0;
          if (callbacks.onChange) callbacks.onChange();
        });
      });
      row.querySelector('.field-belongStep').addEventListener('change', () => {
        evt.belongStep = row.querySelector('.field-belongStep').value;
        if (callbacks.onChange) callbacks.onChange();
      });

      row.querySelector('.btn-remove-ee').addEventListener('click', () => {
        errorEvents.splice(idx, 1);
        renderList();
        if (callbacks.onChange) callbacks.onChange();
      });

      listEl.appendChild(frag);
    });
  }

  function readErrorEvent(evt, row) {
    evt.eventCode = row.querySelector('.field-eventCode').value;
    evt.eventScore = parseFloat(row.querySelector('.field-eventScore').value) || 0;
    evt.duration = Number(row.querySelector('.field-duration').value) || 0;
    evt.eventDesc = row.querySelector('.field-eventDesc').value;
    evt.belongStep = row.querySelector('.field-belongStep').value;
    // Read deps
    const depRows = row.querySelectorAll('.eventdep-row');
    evt.eventDeps = [];
    depRows.forEach(drow => {
      const type = drow.querySelector('.field-depType').value;
      const codesSel = drow.querySelector('.field-depEventCodes');
      const codes = [];
      for (let o of codesSel.selectedOptions) {
        if (o.value) codes.push(o.value);
      }
      evt.eventDeps.push({ type, eventCodes: codes });
    });
  }

  renderList();
  return { container, renderList };
}

export { renderErrorEvents };
