function renderTopForm(configJson, callbacks) {
  const tpl = document.getElementById('tpl-top-form');
  const frag = tpl.content.cloneNode(true);
  const root = frag.querySelector('.top-form');

  const inputs = {
    name: root.querySelector('.field-name'),
    experimentCode: root.querySelector('.field-experimentCode'),
    version: root.querySelector('.field-version'),
    subjectType: root.querySelector('.field-subjectType'),
    paperType: root.querySelector('.field-paperType'),
    ratingLevel: root.querySelector('.field-ratingLevel'),
    experimentTotalScore: root.querySelector('.field-experimentTotalScore'),
    stat: root.querySelector('#stat-step-score'),
  };

  function syncToDOM() {
    inputs.name.value = configJson.name || '';
    inputs.experimentCode.value = configJson.experimentCode || '';
    inputs.version.value = configJson.version || '';
    inputs.subjectType.value = configJson.subjectType;
    inputs.paperType.value = configJson.paperType;
    inputs.ratingLevel.value = configJson.ratingLevel;
    inputs.experimentTotalScore.value = configJson.experimentTotalScore;
  }

  function syncFromDOM() {
    configJson.name = inputs.name.value;
    configJson.experimentCode = inputs.experimentCode.value;
    configJson.version = inputs.version.value;
    configJson.subjectType = Number(inputs.subjectType.value);
    configJson.paperType = Number(inputs.paperType.value);
    configJson.ratingLevel = Number(inputs.ratingLevel.value);
    configJson.experimentTotalScore = parseFloat(inputs.experimentTotalScore.value) || 0;
  }

  // Bind sync
  ['name', 'experimentCode', 'version', 'experimentTotalScore'].forEach(k => {
    inputs[k].addEventListener('input', () => {
      const old = configJson[k];
      if (k === 'experimentTotalScore') {
        configJson[k] = parseFloat(inputs[k].value) || 0;
      } else {
        configJson[k] = inputs[k].value;
      }
      if (callbacks.onChange) callbacks.onChange();
    });
  });
  ['subjectType', 'paperType', 'ratingLevel'].forEach(k => {
    inputs[k].addEventListener('change', () => {
      configJson[k] = Number(inputs[k].value);
      if (callbacks.onChange) callbacks.onChange();
    });
  });

  // Buttons
  root.querySelector('.btn-save').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onSave) callbacks.onSave();
  });
  root.querySelector('.btn-clear').addEventListener('click', () => {
    if (callbacks.onClear) callbacks.onClear();
  });
  root.querySelector('.btn-upload-excel').addEventListener('click', () => {
    root.querySelector('#file-excel').click();
  });
  root.querySelector('.btn-upload-json').addEventListener('click', () => {
    root.querySelector('#file-json').click();
  });
  root.querySelector('.btn-export-upload').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onExportUpload) callbacks.onExportUpload();
  });
  root.querySelector('.btn-export-platform').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onExportPlatform) callbacks.onExportPlatform();
  });
  root.querySelector('.btn-export-box').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onExportBox) callbacks.onExportBox();
  });
  root.querySelector('.btn-preview').addEventListener('click', () => {
    syncFromDOM();
    if (callbacks.onPreview) callbacks.onPreview();
  });

  // File inputs
  root.querySelector('#file-excel').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && callbacks.onUploadExcel) callbacks.onUploadExcel(file);
    e.target.value = '';
  });
  root.querySelector('#file-json').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && callbacks.onUploadJson) callbacks.onUploadJson(file);
    e.target.value = '';
  });

  function updateStat(sumFn, correctFn, total) {
    const sum = sumFn(configJson);
    const correct = correctFn(configJson, total);
    inputs.stat.textContent = '步骤统计总分：' + sum;
    inputs.stat.style.color = correct ? '#01a850' : '#c52c2c';
  }

  return { root, syncToDOM, syncFromDOM, updateStat, inputs };
}

export { renderTopForm };
