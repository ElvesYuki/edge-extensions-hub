import { store } from './store.js';
import { formatConfigJson } from './model.js';

const EXCEL_META_ROW = 1;
const EXCEL_DATA_START_ROW = 1;
const EXCEL_COLUMNS = {
  experimentName: 0,
  experimentCode: 1,
  stepNum: 2,
  stepCode: 3,
  stepType: 4,
  stepName: 5,
  stepDesc: 6,
  stepTotalScore: 7,
  scorePointCode: 8,
  scorePointType: 9,
  scorePointDesc: 10,
  scorePointTotalScore: 11,
  scorePointEnable: 12,
  scoreEventCode: 13,
  scoreEventType: 14,
  scoreEventDesc: 15,
  scoreEventValue: 16,
  scoreEventIsCorrect: 17,
  scoreEventEnable: 18,
  aiEventCode: 19,
  aiEventDesc: 20,
};

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

  await store.backupCurrentConfig();
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

  await store.backupCurrentConfig();
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

  const metaRow = sheetArray[EXCEL_META_ROW] || [];
  configObject.name = toStringValue(metaRow[EXCEL_COLUMNS.experimentName]);
  configObject.experimentCode = toStringValue(metaRow[EXCEL_COLUMNS.experimentCode]);
  configObject.subjectType = Number(configObject.experimentCode.slice(8, 9)) || 1;

  const steps = [];
  let currentStep = null;
  let currentScorePoint = null;
  let currentScoreEvent = null;

  for (let i = EXCEL_DATA_START_ROW; i < sheetArray.length; i++) {
    const row = sheetArray[i];
    if (!row || row.every(isEmptyCell)) continue;

    const stepNum = row[EXCEL_COLUMNS.stepNum];
    const scorePointCode = row[EXCEL_COLUMNS.scorePointCode];
    const scoreEventCode = row[EXCEL_COLUMNS.scoreEventCode];
    const eventCode = row[EXCEL_COLUMNS.aiEventCode];

    if (!isEmptyCell(stepNum)) {
      currentStep = {
        stepCode: toStringValue(row[EXCEL_COLUMNS.stepCode]),
        stepNum: Number(stepNum),
        stepType: parseStepType(row[EXCEL_COLUMNS.stepType]),
        stepTotalScore: Number(row[EXCEL_COLUMNS.stepTotalScore]) || 0,
        stepDesc: toStringValue(row[EXCEL_COLUMNS.stepDesc]),
        stepName: toStringValue(row[EXCEL_COLUMNS.stepName]),
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

    if (!isEmptyCell(scorePointCode)) {
      currentScorePoint = {
        scoreCode: String(scorePointCode),
        scoreType: parseScorePointType(row[EXCEL_COLUMNS.scorePointType]),
        scoreDesc: toStringValue(row[EXCEL_COLUMNS.scorePointDesc]),
        scoreEnable: toNumberValue(row[EXCEL_COLUMNS.scorePointEnable], 1),
        scoreDefaultScoreType: 1,
        scoreIsCorrect: 1,
        scoreTotalScore: Number(row[EXCEL_COLUMNS.scorePointTotalScore]) || 0,
        scoreEvents: [],
      };
      currentStep.scorePoints.push(currentScorePoint);
      currentScoreEvent = null;
    }

    if (!currentScorePoint) continue;

    if (!isEmptyCell(scoreEventCode)) {
      currentScoreEvent = {
        scoreEventCode: String(scoreEventCode),
        scoreEventType: parseScoreEventType(row[EXCEL_COLUMNS.scoreEventType]),
        scoreEventDesc: toStringValue(row[EXCEL_COLUMNS.scoreEventDesc]),
        scoreEventEnable: toNumberValue(row[EXCEL_COLUMNS.scoreEventEnable], 1),
        scoreEventDefaultStatus: 1,
        scoreEventIsCorrect: parseScoreEventIsCorrect(row[EXCEL_COLUMNS.scoreEventIsCorrect]),
        scoreEventValue: Number(row[EXCEL_COLUMNS.scoreEventValue]) || 0,
        scoreEventStatus: 0,
        events: [],
      };
      currentScorePoint.scoreEvents.push(currentScoreEvent);
    }

    if (!currentScoreEvent) continue;

    if (!isEmptyCell(eventCode)) {
      const aiEvent = {
        eventCode: String(eventCode),
        eventDesc: toStringValue(row[EXCEL_COLUMNS.aiEventDesc]),
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

function isEmptyCell(value) {
  return value === '' || value === undefined || value === null;
}

function toStringValue(value) {
  return isEmptyCell(value) ? '' : String(value);
}

function toNumberValue(value, defaultValue) {
  return isEmptyCell(value) ? defaultValue : Number(value);
}

function parseStepType(value) {
  const text = toStringValue(value);
  if (text.includes('混合')) return 9;
  if (text.includes('报告')) return 1;
  return 0;
}

function parseScorePointType(value) {
  const text = toStringValue(value);
  if (text.includes('混合')) return 9;
  if (text.includes('拍照')) return 2;
  if (text.includes('报告')) return 1;
  return 0;
}

function parseScoreEventType(value) {
  const text = toStringValue(value);
  if (text.includes('拍照')) return 2;
  if (text.includes('报告')) return 1;
  return 0;
}

function parseScoreEventIsCorrect(value) {
  return toStringValue(value).includes('错误') ? 0 : 1;
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
