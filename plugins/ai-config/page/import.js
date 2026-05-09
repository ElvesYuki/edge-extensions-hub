import { store } from './store.js';
import { formatConfigJson } from './model.js';

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}

async function importJsonFile(file) {
  const text = await readFileAsText(file);
  let configJson;
  try {
    configJson = JSON.parse(text);
  } catch (e) {
    return { error: 'JSON 解析失败: ' + e.message };
  }

  const err = formatConfigJson(configJson);
  if (err) return err;

  await store.saveConfig(configJson);
  return null;
}

async function importExcelFile(file) {
  if (typeof XLSX === 'undefined') {
    return { error: 'SheetJS 库加载失败，无法解析 Excel 文件。' };
  }

  const data = await readFileAsArrayBuffer(file);
  let workbook;
  try {
    workbook = XLSX.read(data, { type: 'array' });
  } catch (e) {
    return { error: 'Excel 解析失败: ' + e.message };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { error: 'Excel 文件中未找到工作表。' };
  }

  const sheet = workbook.Sheets[sheetName];
  const sheetArray = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!sheetArray || sheetArray.length < 2) {
    return { error: 'Excel 文件为空或格式不正确。' };
  }

  const configObject = convertConfigObject(sheetArray);
  const err = formatConfigJson(configObject);
  if (err) return err;

  await store.saveConfig(configObject);
  return null;
}

function convertConfigObject(sheetArray) {
  const configObject = {
    name: '',
    experimentCode: '',
    subjectType: 1,
    version: 'V1.0.0',
    paperType: 1,
    ratingLevel: 3,
    experimentTotalScore: 0,
    steps: [],
    errorEvents: [],
  };

  configObject.name = sheetArray[0] && sheetArray[0][0] ? String(sheetArray[0][0]) : '';
  configObject.experimentCode = sheetArray[0] && sheetArray[0][1] !== undefined ? String(sheetArray[0][1]) : '';

  const steps = [];
  let currentStep = null;
  let currentScorePoint = null;
  let currentScoreEvent = null;

  for (let i = 1; i < sheetArray.length; i++) {
    const row = sheetArray[i];
    if (!row || row.every(cell => cell === '' || cell === undefined || cell === null)) continue;

    const stepNum = row[2];
    const scorePointCode = row[8];
    const scoreEventCode = row[13];
    const eventCode = row[19];

    if (stepNum !== '' && stepNum !== undefined && stepNum !== null) {
      // Parse stepType from text
      let stepType = 0;
      const stepTypeText = String(row[4] || '');
      if (stepTypeText.includes('报告')) stepType = 1;
      if (stepTypeText.includes('混合')) stepType = 9;

      currentStep = {
        stepCode: String(row[3] || ''),
        stepNum: Number(stepNum),
        stepType: stepType,
        stepTotalScore: Number(row[7]) || 0,
        stepDesc: String(row[6] || ''),
        stepName: String(row[5] || ''),
        stepEnable: 1,
        stepDefaultScoreType: 1,
        stepDeps: [],
        stepFinishedRules: [[]],
        scorePoints: [],
      };
      steps.push(currentStep);
      currentScorePoint = null;
      currentScoreEvent = null;
    }

    if (!currentStep) continue;

    if (scorePointCode !== '' && scorePointCode !== undefined && scorePointCode !== null) {
      // Parse scoreType from text
      let scoreType = 0;
      const scoreTypeText = String(row[9] || '');
      if (scoreTypeText.includes('报告')) scoreType = 1;
      if (scoreTypeText.includes('拍照')) scoreType = 2;
      if (scoreTypeText.includes('混合')) scoreType = 9;

      currentScorePoint = {
        scoreCode: String(scorePointCode),
        scoreType: scoreType,
        scoreDesc: String(row[10] || ''),
        scoreEnable: row[12] !== undefined && row[12] !== '' ? Number(row[12]) : 1,
        scoreDefaultScoreType: 1,
        scoreIsCorrect: 1,
        scoreTotalScore: Number(row[11]) || 0,
        scoreEvents: [],
      };
      currentStep.scorePoints.push(currentScorePoint);
      currentScoreEvent = null;
    }

    if (!currentScorePoint) continue;

    if (scoreEventCode !== '' && scoreEventCode !== undefined && scoreEventCode !== null) {
      // Parse scoreEventType from text
      let scoreEventType = 0;
      const seTypeText = String(row[14] || '');
      if (seTypeText.includes('报告')) scoreEventType = 1;
      if (seTypeText.includes('拍照')) scoreEventType = 2;

      // Parse scoreEventIsCorrect from text (col 17)
      let scoreEventIsCorrect = 1;
      const isCorrectText = String(row[17] || '');
      if (isCorrectText.includes('错误')) scoreEventIsCorrect = 0;

      currentScoreEvent = {
        scoreEventCode: String(scoreEventCode),
        scoreEventType: scoreEventType,
        scoreEventDesc: String(row[15] || ''),
        scoreEventEnable: row[18] !== undefined && row[18] !== '' ? Number(row[18]) : 1,
        scoreEventDefaultStatus: 1,
        scoreEventIsCorrect: scoreEventIsCorrect,
        scoreEventValue: Number(row[16]) || 0,
        scoreEventStatus: 0,
        events: [],
      };
      currentScorePoint.scoreEvents.push(currentScoreEvent);
    }

    if (!currentScoreEvent) continue;

    if (eventCode !== '' && eventCode !== undefined && eventCode !== null) {
      const aiEvent = {
        eventCode: String(eventCode),
        eventDesc: String(row[20] || ''),
        eventScore: 0,
        duration: 1,
        eventPriority: 1,
        eventStatus: 0,
        eventDeps: [],
      };
      currentScoreEvent.events.push(aiEvent);
    }
  }

  configObject.steps = steps;
  return configObject;
}

async function handleFileImport(file, fileType) {
  if (fileType === 'json') {
    return await importJsonFile(file);
  } else if (fileType === 'excel') {
    return await importExcelFile(file);
  }
  return { error: '不支持的文件类型。' };
}

export { importJsonFile, importExcelFile, handleFileImport };
